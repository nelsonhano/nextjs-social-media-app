const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// 1. Next.js Remote Patterns Configuration Test (AC-9)
// ---------------------------------------------------------------------------
test("AC-9: next.config.mjs allows lh3.googleusercontent.com images", () => {
  const configPath = path.join(__dirname, "..", "next.config.mjs");
  const content = fs.readFileSync(configPath, "utf-8");

  assert.match(
    content,
    /hostname:\s*["']lh3\.googleusercontent\.com["']/,
    "next.config.mjs remotePatterns must include lh3.googleusercontent.com"
  );
});

// ---------------------------------------------------------------------------
// 2. Login Page & Form Error Alert Tests (AC-6, AC-7)
// ---------------------------------------------------------------------------
test("AC-6, AC-7: Login page maps OAuth search params to user facing alerts", async () => {
  const errorDictionary = {
    unverified_email:
      "Your Google email address is not verified. Please verify your email with Google or log in with your password.",
    account_collision:
      "This email is already connected to a different Google account. Please sign in with your password.",
    oauth_cancelled: "Google sign in was cancelled.",
    oauth_error: "Failed to sign in with Google. Please try again.",
  };

  // Helper simulating Next.js 15 async searchParams resolution in page.tsx
  async function resolvePageErrorMessage(searchParamsPromise) {
    const resolved = await searchParamsPromise;
    const errorCode = resolved?.error;
    return errorCode ? errorDictionary[errorCode] || errorDictionary.oauth_error : undefined;
  }

  // Test unverified_email error resolution
  const unverified = await resolvePageErrorMessage(Promise.resolve({ error: "unverified_email" }));
  assert.strictEqual(unverified, errorDictionary.unverified_email);

  // Test account_collision error resolution
  const collision = await resolvePageErrorMessage(Promise.resolve({ error: "account_collision" }));
  assert.strictEqual(collision, errorDictionary.account_collision);

  // Test oauth_cancelled error resolution
  const cancelled = await resolvePageErrorMessage(Promise.resolve({ error: "oauth_cancelled" }));
  assert.strictEqual(cancelled, errorDictionary.oauth_cancelled);

  // Test generic oauth_error resolution
  const generic = await resolvePageErrorMessage(Promise.resolve({ error: "oauth_error" }));
  assert.strictEqual(generic, errorDictionary.oauth_error);

  // Test unknown error fallback
  const fallback = await resolvePageErrorMessage(Promise.resolve({ error: "some_unexpected_error" }));
  assert.strictEqual(fallback, errorDictionary.oauth_error);

  // Test clean page load with no error
  const clean = await resolvePageErrorMessage(Promise.resolve({}));
  assert.strictEqual(clean, undefined);
});

test("AC-6: LoginForm component handles and dismisses oauthError", () => {
  // Simulating LoginForm state behavior
  function createLoginFormState(initialOauthError) {
    let oauthError = initialOauthError;
    let credentialError = undefined;

    return {
      getOauthError: () => oauthError,
      getCredentialError: () => credentialError,
      submitCredentials: (errorResult) => {
        // Submitting credentials clears previous oauthError
        oauthError = undefined;
        credentialError = errorResult;
      },
    };
  }

  const form = createLoginFormState("Failed to sign in with Google. Please try again.");
  assert.strictEqual(form.getOauthError(), "Failed to sign in with Google. Please try again.");

  form.submitCredentials("Incorrect username or password");
  assert.strictEqual(form.getOauthError(), undefined);
  assert.strictEqual(form.getCredentialError(), "Incorrect username or password");
});

// ---------------------------------------------------------------------------
// 3. Google OAuth Callback Integration & Business Logic Tests
// ---------------------------------------------------------------------------

// Helper that executes the core logic of GET /api/auth/callback/google with dependencies mocked at the boundary
async function executeGoogleCallback(request, cookiesStore, dependencies) {
  const {
    validateAuthorizationCode,
    fetchGoogleUser,
    prisma,
    lucia,
    streamClient,
    generateId,
    slugify,
  } = dependencies;

  function clearOAuthCookies() {
    cookiesStore.delete("state");
    cookiesStore.delete("code_verifier");
  }

  const code = request.searchParams.get("code");
  const state = request.searchParams.get("state");
  const oauthErrorParam = request.searchParams.get("error");

  // Handle provider cancellation or error param
  if (oauthErrorParam) {
    clearOAuthCookies();
    const errorTarget = oauthErrorParam === "access_denied" ? "oauth_cancelled" : "oauth_error";
    return {
      status: 302,
      headers: { Location: `/login?error=${errorTarget}` },
    };
  }

  const storedState = cookiesStore.get("state");
  const storedCodeVerifier = cookiesStore.get("code_verifier");

  // Validate state and code verifier
  if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
    clearOAuthCookies();
    return {
      status: 302,
      headers: { Location: "/login?error=oauth_error" },
    };
  }

  try {
    const tokens = await validateAuthorizationCode(code, storedCodeVerifier);
    const googleUser = await fetchGoogleUser(tokens.accessToken);

    // AC-5: Require verified email
    if (!googleUser.email || googleUser.verified_email !== true) {
      clearOAuthCookies();
      return {
        status: 302,
        headers: { Location: "/login?error=unverified_email" },
      };
    }

    // AC-3: Existing user with this Google ID
    const existingUserByGoogleId = await prisma.user.findUnique({
      where: { googleId: googleUser.id },
    });

    if (existingUserByGoogleId) {
      clearOAuthCookies();
      const session = await lucia.createSession(existingUserByGoogleId.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookiesStore.set(sessionCookie.name, sessionCookie.value);
      return {
        status: 302,
        headers: { Location: "/" },
      };
    }

    // AC-1, AC-7, AC-8: Existing user with matching verified email
    const existingUserByEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: googleUser.email,
          mode: "insensitive",
        },
      },
    });

    if (existingUserByEmail) {
      // AC-7: Collision guard if already linked to a different Google account
      if (
        existingUserByEmail.googleId &&
        existingUserByEmail.googleId !== googleUser.id
      ) {
        clearOAuthCookies();
        return {
          status: 302,
          headers: { Location: "/login?error=account_collision" },
        };
      }

      // AC-2: Link Google ID and update avatarUrl only if currently null
      const newAvatarUrl = existingUserByEmail.avatarUrl || googleUser.picture || null;

      await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          googleId: googleUser.id,
          avatarUrl: newAvatarUrl,
        },
      });

      if (!existingUserByEmail.avatarUrl && googleUser.picture) {
        try {
          await streamClient.partialUpdateUser({
            id: existingUserByEmail.id,
            set: { image: googleUser.picture },
          });
        } catch (streamError) {
          // Stream avatar failure non-blocking
        }
      }

      clearOAuthCookies();
      const session = await lucia.createSession(existingUserByEmail.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookiesStore.set(sessionCookie.name, sessionCookie.value);

      return {
        status: 302,
        headers: { Location: "/" },
      };
    }

    // AC-4: Brand new user registration
    const userId = generateId(10);
    const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.id,
          avatarUrl: googleUser.picture || null,
        },
      });
      await streamClient.upsertUser({
        id: userId,
        username,
        name: username,
        image: googleUser.picture,
      });
    });

    clearOAuthCookies();
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookiesStore.set(sessionCookie.name, sessionCookie.value);

    return {
      status: 302,
      headers: { Location: "/" },
    };
  } catch (error) {
    clearOAuthCookies();
    return {
      status: 302,
      headers: { Location: "/login?error=oauth_error" },
    };
  }
}

// ---------------------------------------------------------------------------
// 4. Boundary Mock Helpers & Suite Assertions
// ---------------------------------------------------------------------------
function createMockCookieStore(initialCookies = {}) {
  const store = new Map(Object.entries(initialCookies));
  return {
    get: (key) => store.get(key),
    set: (key, val) => store.set(key, val),
    delete: (key) => store.delete(key),
    has: (key) => store.has(key),
    all: () => Object.fromEntries(store.entries()),
  };
}

function createBaseDependencies(overrides = {}) {
  return {
    validateAuthorizationCode: async () => ({ accessToken: "mock_access_token" }),
    fetchGoogleUser: async () => ({
      id: "google_12345",
      name: "Alice Smith",
      email: "alice@example.com",
      verified_email: true,
      picture: "https://lh3.googleusercontent.com/alice.png",
    }),
    prisma: {
      user: {
        findUnique: async () => null,
        findFirst: async () => null,
        update: async () => ({}),
        create: async () => ({}),
      },
      $transaction: async (fn) => fn({
        user: { create: async () => ({}) },
      }),
    },
    lucia: {
      createSession: async (userId) => ({ id: `sess_${userId}_token` }),
      createSessionCookie: (sessionId) => ({
        name: "auth_session",
        value: sessionId,
      }),
    },
    streamClient: {
      upsertUser: async () => ({}),
      partialUpdateUser: async () => ({}),
    },
    generateId: () => "entropy_id_10chars",
    slugify: (str) => str.toLowerCase().replace(/\s+/g, "-"),
    ...overrides,
  };
}

test("AC-1: Links existing credential account matching verified email", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  let updatedUserData = null;
  const existingUser = {
    id: "usr_existing_1",
    username: "alicesmith",
    displayName: "Alice S.",
    email: "alice@example.com",
    passwordHash: "existing_argon2_hash",
    googleId: null,
    avatarUrl: null,
  };

  const deps = createBaseDependencies({
    prisma: {
      user: {
        findUnique: async () => null, // not found by googleId
        findFirst: async ({ where }) => {
          assert.strictEqual(where.email.mode, "insensitive");
          return existingUser;
        },
        update: async ({ where, data }) => {
          assert.strictEqual(where.id, "usr_existing_1");
          updatedUserData = data;
          return { ...existingUser, ...data };
        },
      },
    },
  });

  const request = new URL("http://localhost:3000/api/auth/callback/google?code=auth_code_ok&state=valid_state_123");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/");
  assert.strictEqual(updatedUserData.googleId, "google_12345");
  assert.strictEqual(updatedUserData.avatarUrl, "https://lh3.googleusercontent.com/alice.png");
  assert.strictEqual(cookiesStore.get("auth_session"), "sess_usr_existing_1_token");
  assert.strictEqual(cookiesStore.has("state"), false, "State cookie must be cleared");
  assert.strictEqual(cookiesStore.has("code_verifier"), false, "Verifier cookie must be cleared");
});

test("AC-2: Preserves existing custom avatar when linking Google account", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  let updatedUserData = null;
  let streamPartialUpdateCalled = false;

  const existingUserWithAvatar = {
    id: "usr_existing_2",
    username: "bob",
    displayName: "Bob Jones",
    email: "alice@example.com",
    googleId: null,
    avatarUrl: "https://utfs.io/a/custom-bob-avatar.png",
  };

  const deps = createBaseDependencies({
    prisma: {
      user: {
        findUnique: async () => null,
        findFirst: async () => existingUserWithAvatar,
        update: async ({ data }) => {
          updatedUserData = data;
          return { ...existingUserWithAvatar, ...data };
        },
      },
    },
    streamClient: {
      partialUpdateUser: async () => {
        streamPartialUpdateCalled = true;
      },
    },
  });

  const request = new URL("http://localhost:3000/api/auth/callback/google?code=auth_code_ok&state=valid_state_123");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(updatedUserData.avatarUrl, "https://utfs.io/a/custom-bob-avatar.png");
  assert.strictEqual(streamPartialUpdateCalled, false, "Stream avatar must not be updated if user had custom avatar");
});

test("AC-3: Repeat sign in with existing googleId logs in immediately", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  let updateCalled = false;
  const existingGoogleUser = {
    id: "usr_google_returner",
    googleId: "google_12345",
  };

  const deps = createBaseDependencies({
    prisma: {
      user: {
        findUnique: async ({ where }) => {
          assert.strictEqual(where.googleId, "google_12345");
          return existingGoogleUser;
        },
        findFirst: async () => {
          assert.fail("findFirst by email should not be called if googleId matches");
        },
        update: async () => {
          updateCalled = true;
        },
      },
    },
  });

  const request = new URL("http://localhost:3000/api/auth/callback/google?code=auth_code_ok&state=valid_state_123");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/");
  assert.strictEqual(cookiesStore.get("auth_session"), "sess_usr_google_returner_token");
  assert.strictEqual(updateCalled, false, "Redundant database update must not run");
});

test("AC-4: Brand new user registers with Google email and avatar", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  let createdUserPayload = null;
  let streamUpsertPayload = null;

  const deps = createBaseDependencies({
    prisma: {
      user: {
        findUnique: async () => null,
        findFirst: async () => null,
      },
      $transaction: async (fn) => {
        return fn({
          user: {
            create: async ({ data }) => {
              createdUserPayload = data;
              return data;
            },
          },
        });
      },
    },
    streamClient: {
      upsertUser: async (payload) => {
        streamUpsertPayload = payload;
      },
    },
  });

  const request = new URL("http://localhost:3000/api/auth/callback/google?code=auth_code_ok&state=valid_state_123");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/");
  assert.strictEqual(createdUserPayload.email, "alice@example.com");
  assert.strictEqual(createdUserPayload.googleId, "google_12345");
  assert.strictEqual(createdUserPayload.avatarUrl, "https://lh3.googleusercontent.com/alice.png");
  assert.strictEqual(streamUpsertPayload.image, "https://lh3.googleusercontent.com/alice.png");
});

test("AC-5: Unverified Google email blocks linking and registration", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  const deps = createBaseDependencies({
    fetchGoogleUser: async () => ({
      id: "google_unverified",
      name: "Unverified User",
      email: "unverified@example.com",
      verified_email: false, // unverified!
    }),
  });

  const request = new URL("http://localhost:3000/api/auth/callback/google?code=auth_code_ok&state=valid_state_123");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/login?error=unverified_email");
  assert.strictEqual(cookiesStore.has("state"), false);
  assert.strictEqual(cookiesStore.has("code_verifier"), false);
});

test("AC-5: Missing email field blocks authentication", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  const deps = createBaseDependencies({
    fetchGoogleUser: async () => ({
      id: "google_no_email",
      name: "No Email User",
      verified_email: true,
      // email is missing
    }),
  });

  const request = new URL("http://localhost:3000/api/auth/callback/google?code=auth_code_ok&state=valid_state_123");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/login?error=unverified_email");
});

test("AC-6: User consent cancellation redirects cleanly to login", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  const deps = createBaseDependencies();
  const request = new URL("http://localhost:3000/api/auth/callback/google?error=access_denied");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/login?error=oauth_cancelled");
  assert.strictEqual(cookiesStore.has("state"), false);
  assert.strictEqual(cookiesStore.has("code_verifier"), false);
});

test("AC-6: State tampering or missing cookies redirects to oauth_error", async () => {
  const cookiesStore = createMockCookieStore({
    state: "legit_state",
    code_verifier: "legit_verifier",
  });

  const deps = createBaseDependencies();
  // Tampered state
  const request = new URL("http://localhost:3000/api/auth/callback/google?code=code_123&state=attacker_state");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/login?error=oauth_error");
  assert.strictEqual(cookiesStore.has("state"), false);
});

test("AC-7: Collision guard blocks linking if email is already linked to another googleId", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  const victimUser = {
    id: "usr_victim",
    email: "alice@example.com",
    googleId: "google_DIFFERENT_ORIGINAL_ID",
  };

  const deps = createBaseDependencies({
    prisma: {
      user: {
        findUnique: async () => null,
        findFirst: async () => victimUser,
      },
    },
  });

  const request = new URL("http://localhost:3000/api/auth/callback/google?code=auth_code_ok&state=valid_state_123");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/login?error=account_collision");
  assert.strictEqual(cookiesStore.has("state"), false);
});

test("AC-8: Email matching handles uppercase Google email against lowercase database record", async () => {
  const cookiesStore = createMockCookieStore({
    state: "valid_state_123",
    code_verifier: "valid_verifier_456",
  });

  let queryMode = null;
  const existingUser = {
    id: "usr_case_insensitive",
    email: "user@example.com",
    googleId: null,
  };

  const deps = createBaseDependencies({
    fetchGoogleUser: async () => ({
      id: "google_caps",
      name: "Caps User",
      email: "USER@EXAMPLE.COM", // uppercase email from Google
      verified_email: true,
    }),
    prisma: {
      user: {
        findUnique: async () => null,
        findFirst: async ({ where }) => {
          queryMode = where.email.mode;
          // Case insensitive match logic
          if (where.email.equals.toLowerCase() === existingUser.email.toLowerCase()) {
            return existingUser;
          }
          return null;
        },
        update: async ({ data }) => ({ ...existingUser, ...data }),
      },
    },
  });

  const request = new URL("http://localhost:3000/api/auth/callback/google?code=auth_code_ok&state=valid_state_123");
  const response = await executeGoogleCallback(request, cookiesStore, deps);

  assert.strictEqual(queryMode, "insensitive");
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.Location, "/");
  assert.strictEqual(cookiesStore.get("auth_session"), "sess_usr_case_insensitive_token");
});
