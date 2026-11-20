"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import FollowButton from "@/components/FollowButton";
import { useToast } from "@/components/ui/use-toast";
import { PostData } from "@/lib/types";
import { cn, formatRelativeDate } from "@/lib/utils";
import { Media } from "@prisma/client";
import { MessageSquare, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Comments from "../comments/Comments";
import Linkify from "../Linkify";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import BookmarkButton from "./BookmarkButton";
import LikeButton from "./LikeButton";
import PostMoreButton from "./PostMoreButton";

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {
  const { user } = useSession();
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="group/post space-y-4 rounded-3xl glass-card p-4 sm:p-5 shadow-sm border border-white/40 dark:border-white/10 transition-all hover:shadow-md">
      {/* Author Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserTooltip user={post.user}>
            <Link href={`/users/${post.user.username}`} className="group">
              <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px] transition-transform group-hover:scale-105">
                <UserAvatar
                  avatarUrl={post.user.avatarUrl}
                  className="size-11 border-2 border-background"
                />
              </div>
            </Link>
          </UserTooltip>
          <div>
            <UserTooltip user={post.user}>
              <Link
                href={`/users/${post.user.username}`}
                className="block font-bold text-sm sm:text-base hover:underline line-clamp-1"
              >
                {post.user.displayName}
              </Link>
            </UserTooltip>
            <Link
              href={`/posts/${post.id}`}
              className="block text-xs text-muted-foreground hover:underline"
              suppressHydrationWarning
            >
              {formatRelativeDate(post.createdAt)}
            </Link>
          </div>
        </div>

        {/* Action: Follow pill or author more options */}
        <div className="flex items-center gap-2">
          {post.user.id !== user.id ? (
            <FollowButton
              userId={post.user.id}
              initialState={{
                followers: post.user._count.followers,
                isFollowedByUser: !!post.user.followers.length,
              }}
              className="rounded-full h-8 px-4 text-xs font-bold"
            />
          ) : (
            <PostMoreButton
              post={post}
              className="opacity-70 transition-opacity hover:opacity-100"
            />
          )}
        </div>
      </div>

      {/* Post Content */}
      <Linkify>
        <div className="whitespace-pre-line break-words text-sm sm:text-base text-foreground/90">
          {post.content}
        </div>
      </Linkify>

      {/* Media Collage Grid */}
      {!!post.attachments.length && (
        <MediaGrid attachments={post.attachments} />
      )}

      {/* Bottom Engagement Counters */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <LikeButton
            postId={post.id}
            initialState={{
              likes: post._count.likes,
              isLikedByUser: post.likes.some((like) => like.userId === user.id),
            }}
          />
          <CommentButton
            post={post}
            onClick={() => setShowComments(!showComments)}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <BookmarkButton
            postId={post.id}
            initialState={{
              isBookmarkedByUser: post.bookmarks.some(
                (bookmark) => bookmark.userId === user.id,
              ),
            }}
          />
          <ShareButton post={post} />
        </div>
      </div>

      {showComments && <Comments post={post} />}
    </article>
  );
}

interface MediaGridProps {
  attachments: Media[];
}

function MediaGrid({ attachments }: MediaGridProps) {
  const images = attachments.filter((m) => m.type === "IMAGE");
  const videos = attachments.filter((m) => m.type === "VIDEO");

  return (
    <div className="space-y-2">
      {/* Images Collage */}
      {!!images.length && <ImagesCollage images={images} />}

      {/* Standalone Videos */}
      {videos.map((video) => (
        <div
          key={video.id}
          className="overflow-hidden rounded-2xl border border-border/40 bg-black aspect-video max-h-[30rem] w-full"
        >
          <video
            src={video.url}
            controls
            playsInline
            className="size-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function ImagesCollage({ images }: { images: Media[] }) {
  const count = images.length;

  // Single Image: 16/9 aspect ratio
  if (count === 1) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/40 aspect-[16/9] max-h-[30rem] w-full bg-muted/30">
        <Image
          src={images[0].url}
          alt="Post attachment"
          fill
          className="object-cover transition-transform hover:scale-[1.02] duration-300"
        />
      </div>
    );
  }

  // 2 Images: 2 columns 4/3 aspect ratio
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 aspect-[4/3] w-full">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/30"
          >
            <Image
              src={image.url}
              alt="Post attachment"
              fill
              className="object-cover transition-transform hover:scale-[1.02] duration-300"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 Images: 1 large left span, 2 stacked right
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-2 aspect-[4/3] w-full">
        <div className="relative row-span-2 overflow-hidden rounded-2xl border border-border/40 bg-muted/30">
          <Image
            src={images[0].url}
            alt="Post attachment"
            fill
            className="object-cover transition-transform hover:scale-[1.02] duration-300"
          />
        </div>
        <div className="grid grid-rows-2 gap-2 h-full">
          {images.slice(1, 3).map((image) => (
            <div
              key={image.id}
              className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/30"
            >
              <Image
                src={image.url}
                alt="Post attachment"
                fill
                className="object-cover transition-transform hover:scale-[1.02] duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4 or more Images: 2x2 grid
  const displayImages = images.slice(0, 4);
  const remainingCount = images.length - 4;

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 aspect-square w-full">
      {displayImages.map((image, idx) => (
        <div
          key={image.id}
          className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/30"
        >
          <Image
            src={image.url}
            alt="Post attachment"
            fill
            className="object-cover transition-transform hover:scale-[1.02] duration-300"
          />
          {idx === 3 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold">
              +{remainingCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface CommentButtonProps {
  post: PostData;
  onClick: () => void;
}

function CommentButton({ post, onClick }: CommentButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-muted/70 hover:bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95"
    >
      <MessageSquare className="size-4" />
      <span className="tabular-nums">
        {post._count.comments} {post._count.comments === 1 ? "Comment" : "Comments"}
      </span>
    </button>
  );
}

function ShareButton({ post }: { post: PostData }) {
  const { toast } = useToast();

  async function handleShare() {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.user.displayName,
          text: post.content,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(shareUrl);
          toast({ description: "Link copied to clipboard" });
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ description: "Link copied to clipboard" });
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Share post"
      aria-label="Share post"
      className="flex items-center justify-center size-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
    >
      <Share2 className="size-4.5" />
    </button>
  );
}
