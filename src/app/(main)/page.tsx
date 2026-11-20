import StoriesTray from "@/components/stories/StoriesTray";
import PostEditor from "@/components/posts/editor/PostEditor";
import TrendsSidebar from "@/components/TrendsSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowingFeed from "./FollowingFeed";
import ForYouFeed from "./ForYouFeed";

export default function Home() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <StoriesTray />
        <PostEditor />
        <Tabs defaultValue="for-you" className="space-y-4">
          <TabsList className="glass-pill rounded-full p-1.5 h-auto bg-muted/60 backdrop-blur-md border border-white/40 dark:border-white/10 gap-1.5 shadow-sm">
            <TabsTrigger
              value="for-you"
              className="rounded-full px-5 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-[#FF3B69] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              For you
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="rounded-full px-5 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-[#FF3B69] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Following
            </TabsTrigger>
          </TabsList>
          <TabsContent value="for-you">
            <ForYouFeed />
          </TabsContent>
          <TabsContent value="following">
            <FollowingFeed />
          </TabsContent>
        </Tabs>
      </div>
      <TrendsSidebar />
    </main>
  );
}
