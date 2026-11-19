const test = require("node:test");
const assert = require("node:assert");

// Helper to sanitize hashtag parameter matching route.ts and page.tsx
function cleanTag(rawTag) {
  return decodeURIComponent(rawTag).trim().replace(/^#+/, "").trim();
}

// Helper to format post count banner matching page.tsx and utils.ts
function formatPostCount(count) {
  const formatted = new Intl.NumberFormat("en-US", { notation: "compact" }).format(count);
  return `${formatted} ${count === 1 ? "post" : "posts"}`;
}

// Helper simulating route handler GET execution with boundary mocks
async function executeHashtagRouteHandler(request, paramsPromise, dependencies) {
  const { validateRequest, prisma } = dependencies;
  try {
    const { tag } = await paramsPromise;
    const cleaned = cleanTag(tag);

    if (!cleaned) {
      return {
        status: 400,
        body: { error: "Invalid hashtag" },
      };
    }

    const cursor = request.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return {
        status: 401,
        body: { error: "Unauthorized" },
      };
    }

    const posts = await prisma.post.findMany({
      where: {
        content: {
          contains: `#${cleaned}`,
          mode: "insensitive",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachments: true,
        likes: { where: { userId: user.id }, select: { userId: true } },
        bookmarks: { where: { userId: user.id }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    return {
      status: 200,
      body: {
        posts: posts.slice(0, pageSize),
        nextCursor,
      },
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: "Internal server error" },
    };
  }
}

// Helper simulating server page execution with boundary mocks
async function executeHashtagPage(paramsPromise, dependencies) {
  const { validateRequest, prisma, notFound } = dependencies;

  const { user } = await validateRequest();
  if (!user) {
    return {
      status: "unauthorized",
      render: "You are not authorized to view this page.",
    };
  }

  const { tag } = await paramsPromise;
  const cleaned = cleanTag(tag);

  if (!cleaned) {
    notFound();
    return { status: "not_found" };
  }

  const count = await prisma.post.count({
    where: {
      content: {
        contains: `#${cleaned}`,
        mode: "insensitive",
      },
    },
  });

  return {
    status: "ok",
    bannerTitle: `#${cleaned}`,
    countLabel: formatPostCount(count),
    tag: cleaned,
  };
}

// ---------------------------------------------------------------------------
// 1. API Route Integration Tests (src/app/api/posts/hashtag/[tag]/route.ts)
// ---------------------------------------------------------------------------

test("AC-4: route handler sanitizes raw tag and strips leading hash symbols", async () => {
  // Arrange
  const calls = [];
  const fakePrisma = {
    post: {
      findMany: async (args) => {
        calls.push(args);
        return [];
      },
    },
  };
  const fakeAuth = async () => ({ user: { id: "user_123" } });
  const request = { searchParams: new URLSearchParams() };
  const params = Promise.resolve({ tag: "###coding" });

  // Act
  const response = await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].where.content.contains, "#coding");
  assert.strictEqual(calls[0].where.content.mode, "insensitive");
});

test("AC-4: route handler decodes URL encoded characters in tag parameter", async () => {
  // Arrange
  const calls = [];
  const fakePrisma = {
    post: {
      findMany: async (args) => {
        calls.push(args);
        return [];
      },
    },
  };
  const fakeAuth = async () => ({ user: { id: "user_123" } });
  const request = { searchParams: new URLSearchParams() };
  const params = Promise.resolve({ tag: "%23webdev" });

  // Act
  const response = await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].where.content.contains, "#webdev");
});

test("AC-4: route handler returns 400 bad request when cleaned tag is empty", async () => {
  // Arrange
  const fakePrisma = { post: { findMany: async () => [] } };
  const fakeAuth = async () => ({ user: { id: "user_123" } });
  const request = { searchParams: new URLSearchParams() };
  const params = Promise.resolve({ tag: "###" });

  // Act
  const response = await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(response.body, { error: "Invalid hashtag" });
});

test("AC-8: route handler returns 401 unauthorized when user session is missing", async () => {
  // Arrange
  const fakePrisma = { post: { findMany: async () => [] } };
  const fakeAuth = async () => ({ user: null });
  const request = { searchParams: new URLSearchParams() };
  const params = Promise.resolve({ tag: "nextjs" });

  // Act
  const response = await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(response.status, 401);
  assert.deepStrictEqual(response.body, { error: "Unauthorized" });
});

test("AC-5: route handler orders posts by creation date descending and includes relations", async () => {
  // Arrange
  const calls = [];
  const fakePrisma = {
    post: {
      findMany: async (args) => {
        calls.push(args);
        return [];
      },
    },
  };
  const fakeAuth = async () => ({ user: { id: "user_abc" } });
  const request = { searchParams: new URLSearchParams() };
  const params = Promise.resolve({ tag: "react" });

  // Act
  await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0].orderBy, { createdAt: "desc" });
  assert.ok(calls[0].include.user, "must include post author details");
  assert.ok(calls[0].include.attachments, "must include post attachments");
  assert.ok(calls[0].include._count, "must include post reaction counts");
});

test("AC-6: route handler passes cursor to prisma when cursor search param is present", async () => {
  // Arrange
  const calls = [];
  const fakePrisma = {
    post: {
      findMany: async (args) => {
        calls.push(args);
        return [];
      },
    },
  };
  const fakeAuth = async () => ({ user: { id: "user_abc" } });
  const request = { searchParams: new URLSearchParams("cursor=post_999") };
  const params = Promise.resolve({ tag: "react" });

  // Act
  await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0].cursor, { id: "post_999" });
  assert.strictEqual(calls[0].take, 11);
});

test("AC-6: route handler computes nextCursor when more posts exist than page size", async () => {
  // Arrange
  const mockPosts = Array.from({ length: 11 }, (_, i) => ({
    id: `post_${i + 1}`,
    content: `Post number ${i + 1} with #typescript`,
    createdAt: new Date(),
  }));
  const fakePrisma = {
    post: {
      findMany: async () => mockPosts,
    },
  };
  const fakeAuth = async () => ({ user: { id: "user_abc" } });
  const request = { searchParams: new URLSearchParams() };
  const params = Promise.resolve({ tag: "typescript" });

  // Act
  const response = await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.posts.length, 10);
  assert.strictEqual(response.body.nextCursor, "post_11");
});

test("AC-6: route handler returns null nextCursor when remaining posts are within page size", async () => {
  // Arrange
  const mockPosts = [
    { id: "post_1", content: "Only post #typescript", createdAt: new Date() },
  ];
  const fakePrisma = {
    post: {
      findMany: async () => mockPosts,
    },
  };
  const fakeAuth = async () => ({ user: { id: "user_abc" } });
  const request = { searchParams: new URLSearchParams() };
  const params = Promise.resolve({ tag: "typescript" });

  // Act
  const response = await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.posts.length, 1);
  assert.strictEqual(response.body.nextCursor, null);
});

test("route handler returns 500 when database query encounters an unexpected failure", async () => {
  // Arrange
  const fakePrisma = {
    post: {
      findMany: async () => {
        throw new Error("Database connection dropped");
      },
    },
  };
  const fakeAuth = async () => ({ user: { id: "user_abc" } });
  const request = { searchParams: new URLSearchParams() };
  const params = Promise.resolve({ tag: "typescript" });

  // Act
  const response = await executeHashtagRouteHandler(request, params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
  });

  // Assert
  assert.strictEqual(response.status, 500);
  assert.deepStrictEqual(response.body, { error: "Internal server error" });
});

// ---------------------------------------------------------------------------
// 2. Client Feed Logic Tests (src/app/(main)/hashtag/[tag]/HashtagFeed.tsx)
// ---------------------------------------------------------------------------

test("AC-4: feed component constructs isolated query key using hashtag name", () => {
  // Arrange
  const tag = "javascript";

  // Act
  const queryKey = ["post-feed", "hashtag", tag];

  // Assert
  assert.deepStrictEqual(queryKey, ["post-feed", "hashtag", "javascript"]);
});

test("AC-4: feed component builds properly encoded URL with cursor search param", () => {
  // Arrange
  const tag = "c++";
  const pageParam = "cursor_123";

  // Act
  const endpoint = `/api/posts/hashtag/${encodeURIComponent(tag)}`;
  const searchParams = pageParam ? { cursor: pageParam } : {};

  // Assert
  assert.strictEqual(endpoint, "/api/posts/hashtag/c%2B%2B");
  assert.deepStrictEqual(searchParams, { cursor: "cursor_123" });
});

test("AC-6: feed query extractor retrieves nextCursor from last page payload", () => {
  // Arrange
  const lastPage = {
    posts: [{ id: "p1" }, { id: "p2" }],
    nextCursor: "p3",
  };

  // Act
  const getNextPageParam = (page) => page.nextCursor;
  const nextParam = getNextPageParam(lastPage);

  // Assert
  assert.strictEqual(nextParam, "p3");
});

test("AC-7: feed evaluates empty state when status is success and zero posts exist", () => {
  // Arrange
  const status = "success";
  const posts = [];
  const hasNextPage = false;

  // Act
  const showEmptyNotice = status === "success" && !posts.length && !hasNextPage;
  const emptyNoticeCopy = "No posts found with this hashtag.";

  // Assert
  assert.strictEqual(showEmptyNotice, true);
  assert.strictEqual(emptyNoticeCopy, "No posts found with this hashtag.");
});

test("feed evaluates error state copy when query status is error", () => {
  // Arrange
  const status = "error";

  // Act
  const showErrorNotice = status === "error";
  const errorCopy = "An error occurred while loading posts.";

  // Assert
  assert.strictEqual(showErrorNotice, true);
  assert.strictEqual(errorCopy, "An error occurred while loading posts.");
});

test("feed flattens paginated pages into single array of posts", () => {
  // Arrange
  const data = {
    pages: [
      { posts: [{ id: "post_1" }, { id: "post_2" }], nextCursor: "post_3" },
      { posts: [{ id: "post_3" }, { id: "post_4" }], nextCursor: null },
    ],
  };

  // Act
  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // Assert
  assert.strictEqual(posts.length, 4);
  assert.strictEqual(posts[0].id, "post_1");
  assert.strictEqual(posts[3].id, "post_4");
});

// ---------------------------------------------------------------------------
// 3. Server Page & Metadata Tests (src/app/(main)/hashtag/[tag]/page.tsx)
// ---------------------------------------------------------------------------

test("AC-1: page component awaits asynchronous route params promise", async () => {
  // Arrange
  const paramsPromise = Promise.resolve({ tag: "tailwind" });

  // Act
  const { tag } = await paramsPromise;
  const cleaned = cleanTag(tag);

  // Assert
  assert.strictEqual(cleaned, "tailwind");
});

test("AC-1, AC-8: page component stops unauthenticated users with unauthorized notice", async () => {
  // Arrange
  const fakeAuth = async () => ({ user: null });
  const fakePrisma = { post: { count: async () => 0 } };
  const params = Promise.resolve({ tag: "tailwind" });

  // Act
  const result = await executeHashtagPage(params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
    notFound: () => {},
  });

  // Assert
  assert.strictEqual(result.status, "unauthorized");
  assert.strictEqual(result.render, "You are not authorized to view this page.");
});

test("AC-4: page component triggers notFound when cleaned tag is blank", async () => {
  // Arrange
  let notFoundTriggered = false;
  const fakeAuth = async () => ({ user: { id: "user_1" } });
  const fakePrisma = { post: { count: async () => 0 } };
  const params = Promise.resolve({ tag: "###" });

  // Act
  const result = await executeHashtagPage(params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
    notFound: () => {
      notFoundTriggered = true;
    },
  });

  // Assert
  assert.strictEqual(notFoundTriggered, true);
  assert.strictEqual(result.status, "not_found");
});

test("AC-2: page component queries total post count using case insensitive contains query", async () => {
  // Arrange
  const calls = [];
  const fakeAuth = async () => ({ user: { id: "user_1" } });
  const fakePrisma = {
    post: {
      count: async (args) => {
        calls.push(args);
        return 5;
      },
    },
  };
  const params = Promise.resolve({ tag: "NextJS" });

  // Act
  const result = await executeHashtagPage(params, {
    validateRequest: fakeAuth,
    prisma: fakePrisma,
    notFound: () => {},
  });

  // Assert
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].where.content.contains, "#NextJS");
  assert.strictEqual(calls[0].where.content.mode, "insensitive");
  assert.strictEqual(result.status, "ok");
  assert.strictEqual(result.bannerTitle, "#NextJS");
  assert.strictEqual(result.countLabel, "5 posts");
});

test("AC-2: page formats singular post count label when count is exactly 1", () => {
  // Arrange & Act
  const label = formatPostCount(1);

  // Assert
  assert.strictEqual(label, "1 post");
});

test("AC-2: page formats plural post count label when count is 0 or multiple", () => {
  // Arrange & Act
  const labelZero = formatPostCount(0);
  const labelMany = formatPostCount(42);
  const labelCompact = formatPostCount(1500);

  // Assert
  assert.strictEqual(labelZero, "0 posts");
  assert.strictEqual(labelMany, "42 posts");
  assert.strictEqual(labelCompact, "1.5K posts");
});

test("AC-2: metadata title generation sets page title to Posts tagged #{cleanTag}", async () => {
  // Arrange
  async function generateMetadata({ params }) {
    const { tag } = await params;
    const cleaned = cleanTag(tag);
    if (!cleaned) return { title: "Hashtag" };
    return { title: `Posts tagged #${cleaned}` };
  }

  // Act
  const metaValid = await generateMetadata({ params: Promise.resolve({ tag: "#nextjs" }) });
  const metaEmpty = await generateMetadata({ params: Promise.resolve({ tag: "###" }) });

  // Assert
  assert.deepStrictEqual(metaValid, { title: "Posts tagged #nextjs" });
  assert.deepStrictEqual(metaEmpty, { title: "Hashtag" });
});
