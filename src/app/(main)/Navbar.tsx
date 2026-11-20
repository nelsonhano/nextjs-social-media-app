import SearchField from "@/components/SearchField";
import UserButton from "@/components/UserButton";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";

export default function Navbar() {
  return (
    <header className="sticky top-2 z-30 mx-auto w-[96%] max-w-7xl rounded-2xl glass-card px-4 py-2.5 shadow-lg border border-white/40 dark:border-white/10 transition-all">
      <div className="flex items-center justify-between gap-3 sm:gap-5">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-[#FF3B69] hover:opacity-90 transition-opacity font-serif italic"
          >
            Glimo
          </Link>
          <div className="hidden sm:block w-64 md:w-80">
            <SearchField />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationsButton
            hideLabel
            className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors p-0"
          />
          <UserButton className="ms-1" />
        </div>
      </div>
    </header>
  );
}
