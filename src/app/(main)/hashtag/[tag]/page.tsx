import { validateRequest } from "@/auth";
import TrendsSidebar from "@/components/TrendsSidebar";
import prisma from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import HashtagFeed from "./HashtagFeed";

interface PageProps {
  params: Promise<{ tag: string }>;
}

function getCleanTag(rawTag: string) {
  return decodeURIComponent(rawTag).trim().replace(/^#+/, "").trim();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const cleanTag = getCleanTag(tag);

  if (!cleanTag) return { title: "Hashtag" };

  return {
    title: `Posts tagged #${cleanTag}`,
  };
}

export default async function Page({ params }: PageProps) {
  const { user } = await validateRequest();

  if (!user) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const { tag } = await params;
  const cleanTag = getCleanTag(tag);

  if (!cleanTag) {
    notFound();
  }

  const count = await prisma.post.count({
    where: {
      content: {
        contains: `#${cleanTag}`,
        mode: "insensitive",
      },
    },
  });

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="line-clamp-2 break-all text-center text-2xl font-bold">
            #{cleanTag}
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            {formatNumber(count)} {count === 1 ? "post" : "posts"}
          </p>
        </div>
        <HashtagFeed tag={cleanTag} />
      </div>
      <TrendsSidebar />
    </main>
  );
}
