import { google, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

interface GoogleUser {
  id: string;
  name: string;
  email?: string;
  verified_email?: boolean;
  picture?: string;
}

function clearOAuthCookies() {
  cookies().delete("state");
  cookies().delete("code_verifier");
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthErrorParam = req.nextUrl.searchParams.get("error");

  if (oauthErrorParam) {
    clearOAuthCookies();
    const errorTarget =
      oauthErrorParam === "access_denied"
        ? "oauth_cancelled"
        : "oauth_error";
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/login?error=${errorTarget}`,
      },
    });
  }

  const storedState = cookies().get("state")?.value;
  const storedCodeVerifier = cookies().get("code_verifier")?.value;

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    clearOAuthCookies();
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=oauth_error",
      },
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      .json<GoogleUser>();

    // AC-5: Require verified email
    if (!googleUser.email || googleUser.verified_email !== true) {
      clearOAuthCookies();
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login?error=unverified_email",
        },
      });
    }

    // AC-3: Existing user with this Google ID
    const existingUserByGoogleId = await prisma.user.findUnique({
      where: {
        googleId: googleUser.id,
      },
    });

    if (existingUserByGoogleId) {
      clearOAuthCookies();
      const session = await lucia.createSession(existingUserByGoogleId.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
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
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/login?error=account_collision",
          },
        });
      }

      // AC-2: Link Google ID and update avatarUrl only if currently null
      const newAvatarUrl =
        existingUserByEmail.avatarUrl || googleUser.picture || null;

      await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          googleId: googleUser.id,
          avatarUrl: newAvatarUrl,
        },
      });

      // Sync avatar to Stream Chat if user had no previous avatar
      if (!existingUserByEmail.avatarUrl && googleUser.picture) {
        try {
          await streamServerClient.partialUpdateUser({
            id: existingUserByEmail.id,
            set: {
              image: googleUser.picture,
            },
          });
        } catch (streamError) {
          console.error("Stream Chat avatar sync error:", streamError);
        }
      }

      clearOAuthCookies();
      const session = await lucia.createSession(existingUserByEmail.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    // AC-4: Brand new user registration
    const userId = generateIdFromEntropySize(10);
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
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
        image: googleUser.picture,
      });
    });

    clearOAuthCookies();
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    clearOAuthCookies();
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=oauth_error",
      },
    });
  }
}
