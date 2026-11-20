import { redirect } from "next/navigation";
import { ReactNode } from "react";

import SessionProvider from "./SessionProvider";
import { validateRequest } from "@/auth";
import MenuBar from "./MenuBar";
import Navbar from "./Navbar";
import FloatingBottomNav from "./FloatingBottomNav";

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await validateRequest();

  if (!session.user) redirect("/login");

  return (
    <SessionProvider value={session}>
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground overflow-x-hidden flex flex-col">
        {/* Ambient gradient mesh */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-200/50 dark:bg-purple-600/25 blur-3xl" />
          <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-blue-200/40 dark:bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-pink-200/40 dark:bg-pink-600/20 blur-3xl" />
        </div>

        <Navbar />
        <div className="mx-auto flex w-full max-w-7xl grow gap-5 p-3 sm:p-5 pb-28 sm:pb-5">
          <MenuBar className="sticky top-[5.25rem] hidden h-fit flex-none space-y-3 rounded-2xl glass-card px-3 py-5 sm:block lg:px-5 xl:w-80" />
          {children}
        </div>
        <FloatingBottomNav />
      </div>
    </SessionProvider>
  );
}
