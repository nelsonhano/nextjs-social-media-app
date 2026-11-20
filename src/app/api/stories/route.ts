import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Find users followed by current user who have recent posts with attachments
    const followedUsers = await prisma.user.findMany({
      where: {
        followers: {
          some: {
            followerId: user.id,
          },
        },
        posts: {
          some: {
            attachments: { some: {} },
            createdAt: { gte: oneDayAgo },
          },
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        posts: {
          where: {
            attachments: { some: {} },
            createdAt: { gte: oneDayAgo },
          },
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            attachments: {
              select: {
                id: true,
                url: true,
                type: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    // 2. If followed users with stories are fewer than 6, fetch other active authors with media posts
    let fallbackUsers: typeof followedUsers = [];
    if (followedUsers.length < 6) {
      const existingIds = [user.id, ...followedUsers.map((u) => u.id)];
      fallbackUsers = await prisma.user.findMany({
        where: {
          id: { notIn: existingIds },
          posts: {
            some: {
              attachments: { some: {} },
            },
          },
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          posts: {
            where: {
              attachments: { some: {} },
            },
            take: 3,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              content: true,
              createdAt: true,
              attachments: {
                select: {
                  id: true,
                  url: true,
                  type: true,
                },
              },
            },
          },
        },
        take: 8 - followedUsers.length,
      });
    }

    const allStoryUsers = [...followedUsers, ...fallbackUsers].map((u, index) => {
      const storyItems = u.posts.flatMap((p) =>
        p.attachments.map((a) => ({
          postId: p.id,
          mediaId: a.id,
          mediaUrl: a.url,
          mediaType: a.type,
          caption: p.content,
          createdAt: p.createdAt,
        })),
      );

      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        isLive: index === 0, // First active user highlights live state matching reference
        stories: storyItems,
      };
    });

    return Response.json(allStoryUsers);
  } catch (error) {
    console.error("Stories fetch error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
