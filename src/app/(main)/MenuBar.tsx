import { Bookmark, Home } from "lucide-react";
import Link from "next/link";

import NotificationsButton from "./NotificationsButton";
import { Button } from "@/components/ui/button";
import streamServerClient from "@/lib/stream";
import MessagesButton from "./MessagesButton";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

interface MenuBarProps {
  className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
  const { user } = await validateRequest();

  if (!user) return null;

  const [unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false,
      },
    }),
    (await streamServerClient.getUnreadCount(user.id)).total_unread_count,
  ]);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3 rounded-2xl w-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="Home"
        asChild
      >
        <Link href="/">
          <Home className="size-5" />
          <span className="hidden lg:inline font-semibold">Home</span>
        </Link>
      </Button>
      <NotificationsButton
        initialState={{ unreadCount: unreadNotificationsCount }}
        className="flex items-center justify-start gap-3 rounded-2xl w-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      />
      <MessagesButton
        initialState={{ unreadCount: unreadMessagesCount }}
        className="flex items-center justify-start gap-3 rounded-2xl w-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      />
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3 rounded-2xl w-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="Bookmarks"
        asChild
      >
        <Link href="/bookmarks">
          <Bookmark className="size-5" />
          <span className="hidden lg:inline font-semibold">Bookmarks</span>
        </Link>
      </Button>
    </div>
  );
}
