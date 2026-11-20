"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import CreatePostModal from "@/components/posts/editor/CreatePostModal";
import UserAvatar from "@/components/UserAvatar";
import kyInstance from "@/lib/ky";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import StoryViewerModal, { StoryUser } from "./StoryViewerModal";

export default function StoriesTray() {
  const { user } = useSession();
  const [selectedUser, setSelectedUser] = useState<StoryUser | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const { data: storyUsers = [], isLoading } = useQuery({
    queryKey: ["stories-feed"],
    queryFn: () => kyInstance.get("/api/stories").json<StoryUser[]>(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <section
        aria-label="Stories"
        className="w-full glass-card rounded-3xl p-3 sm:p-4 border border-white/40 dark:border-white/10 shadow-sm"
      >
        <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar py-1 px-1">
          {/* 1. Current user "Your story" */}
          <div className="flex flex-col items-center gap-1.5 flex-none group cursor-pointer">
            <button
              type="button"
              onClick={() => setCreatePostOpen(true)}
              className="relative rounded-full focus:outline-none transition-transform active:scale-95"
              aria-label="Add to your story"
            >
              <div className="rounded-full p-[2.5px] border-2 border-dashed border-[#FF3B69]/60 group-hover:border-[#FF3B69] transition-colors">
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  className="size-14 sm:size-16 border-2 border-background"
                />
              </div>
              <div className="absolute bottom-0 right-0 rounded-full bg-[#FF3B69] text-white p-1 shadow-md shadow-pink-500/30">
                <Plus className="size-3.5 stroke-[3]" />
              </div>
            </button>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground line-clamp-1 max-w-[4.5rem] text-center">
              Your story
            </span>
          </div>

          {/* 2. Loading state skeletons */}
          {isLoading &&
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-none animate-pulse">
                <div className="size-14 sm:size-16 rounded-full bg-muted/70" />
                <div className="h-3 w-12 rounded-full bg-muted/70" />
              </div>
            ))}

          {/* 3. Followed / Active users with stories */}
          {storyUsers.map((storyUser) => {
            const hasStories = !!storyUser.stories.length;

            return (
              <div
                key={storyUser.id}
                className="flex flex-col items-center gap-1.5 flex-none group cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (hasStories) {
                      setSelectedUser(storyUser);
                      setViewerOpen(true);
                    }
                  }}
                  className="relative rounded-full focus:outline-none transition-transform active:scale-95"
                  aria-label={`View ${storyUser.displayName}'s story`}
                >
                  <div
                    className={
                      hasStories
                        ? "rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2.5px] shadow-sm"
                        : "rounded-full p-[2px] bg-muted"
                    }
                  >
                    <UserAvatar
                      avatarUrl={storyUser.avatarUrl}
                      className="size-14 sm:size-16 border-2 border-background"
                    />
                  </div>

                  {storyUser.isLive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-[#FF3B69] px-1.5 py-0.5 text-[9px] font-black uppercase text-white tracking-wider shadow-sm animate-pulse">
                      LIVE
                    </div>
                  )}
                </button>
                <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground line-clamp-1 max-w-[4.5rem] text-center">
                  {storyUser.displayName || storyUser.username}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <StoryViewerModal
        user={selectedUser}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      <CreatePostModal
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
      />
    </>
  );
}
