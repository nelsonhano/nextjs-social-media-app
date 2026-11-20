"use client";

import kyInstance from "@/lib/ky";
import { MessageCountInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Home, MessageSquare, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CreatePostModal from "@/components/posts/editor/CreatePostModal";

export default function FloatingBottomNav() {
  const pathname = usePathname();
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const { data: messagesData } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: () =>
      kyInstance.get("/api/messages/unread-count").json<MessageCountInfo>(),
    initialData: { unreadCount: 0 },
    refetchInterval: 60 * 1000,
  });

  const navItems = [
    {
      href: "/",
      title: "Home",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/search",
      title: "Search",
      icon: Search,
      isActive: pathname.startsWith("/search"),
    },
    {
      isAction: true,
      title: "Create Post",
    },
    {
      href: "/bookmarks",
      title: "Bookmarks",
      icon: Bookmark,
      isActive: pathname.startsWith("/bookmarks"),
    },
    {
      href: "/messages",
      title: "Messages",
      icon: MessageSquare,
      badge: messagesData.unreadCount,
      isActive: pathname.startsWith("/messages"),
    },
  ];

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md sm:hidden"
      >
        <div className="glass-pill rounded-full px-3 py-2 flex items-center justify-around shadow-2xl border border-white/40 dark:border-white/10">
          {navItems.map((item, index) => {
            if (item.isAction) {
              return (
                <button
                  key="create-action"
                  type="button"
                  onClick={() => setCreatePostOpen(true)}
                  aria-label="Create Post"
                  className="flex items-center justify-center size-12 rounded-2xl bg-[#FF3B69] hover:bg-[#FF2D55] text-white shadow-lg shadow-pink-500/40 transition-transform active:scale-90"
                >
                  <Plus className="size-6 stroke-[2.5]" />
                </button>
              );
            }

            const Icon = item.icon!;
            const isActive = item.isActive;

            return (
              <Link
                key={item.href}
                href={item.href!}
                title={item.title}
                className={cn(
                  "relative flex items-center justify-center size-11 rounded-full transition-all",
                  isActive
                    ? "text-foreground bg-foreground/10 font-bold scale-105"
                    : "text-muted-foreground hover:text-foreground active:scale-95",
                )}
              >
                <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
                {!!item.badge && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-[#FF3B69] text-[10px] font-bold text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <CreatePostModal
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
      />
    </>
  );
}
