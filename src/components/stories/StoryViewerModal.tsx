"use client";

import UserAvatar from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatRelativeDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface StoryItem {
  postId: string;
  mediaId: string;
  mediaUrl: string;
  mediaType: string;
  caption: string;
  createdAt: string;
}

export interface StoryUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isLive?: boolean;
  stories: StoryItem[];
}

interface StoryViewerModalProps {
  user: StoryUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StoryViewerModal({
  user,
  open,
  onOpenChange,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [user]);

  if (!user || !user.stories.length) return null;

  const currentStory = user.stories[currentIndex] || user.stories[0];

  function handleNext() {
    if (currentIndex < user!.stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onOpenChange(false);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-white/30 dark:border-white/10 glass-card rounded-3xl shadow-2xl bg-black/90 text-white">
        <DialogTitle className="sr-only">
          {user.displayName}&apos;s story
        </DialogTitle>

        <div className="relative aspect-[9/16] w-full max-h-[85vh] flex flex-col justify-between overflow-hidden">
          {/* Progress indicators */}
          <div className="absolute top-3 inset-x-3 z-20 flex gap-1.5">
            {user.stories.map((s, idx) => (
              <div
                key={s.mediaId}
                className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{
                    width:
                      idx < currentIndex
                        ? "100%"
                        : idx === currentIndex
                          ? "100%"
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="relative z-20 flex items-center justify-between p-4 pt-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <Link
              href={`/users/${user.username}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2.5 group"
            >
              <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                <UserAvatar avatarUrl={user.avatarUrl} className="size-9 border-2 border-black" />
              </div>
              <div>
                <p className="font-bold text-sm text-white group-hover:underline">
                  {user.displayName}
                </p>
                <p className="text-xs text-white/70">
                  {formatRelativeDate(new Date(currentStory.createdAt))}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full bg-black/50 hover:bg-black/80 p-1.5 text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Media Display */}
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            {currentStory.mediaType === "IMAGE" ? (
              <Image
                src={currentStory.mediaUrl}
                alt="Story content"
                fill
                className="object-cover"
                priority
              />
            ) : (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                className="size-full object-cover"
              />
            )}
          </div>

          {/* Navigation Tap Zones */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/4 bottom-1/4 w-1/3 z-20 focus:outline-none flex items-center justify-start p-2 opacity-0 hover:opacity-80 transition-opacity"
            aria-label="Previous story"
          >
            {currentIndex > 0 && <ChevronLeft className="size-8 text-white drop-shadow" />}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-0 top-1/4 bottom-1/4 w-1/3 z-20 focus:outline-none flex items-center justify-end p-2 opacity-0 hover:opacity-80 transition-opacity"
            aria-label="Next story"
          >
            <ChevronRight className="size-8 text-white drop-shadow" />
          </button>

          {/* Caption & Post link footer */}
          <div className="relative z-20 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent space-y-2">
            {!!currentStory.caption && (
              <p className="text-sm text-white line-clamp-3 drop-shadow">
                {currentStory.caption}
              </p>
            )}
            <Link
              href={`/posts/${currentStory.postId}`}
              onClick={() => onOpenChange(false)}
              className="inline-block text-xs font-semibold text-pink-400 hover:text-pink-300 underline drop-shadow"
            >
              View original post
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
