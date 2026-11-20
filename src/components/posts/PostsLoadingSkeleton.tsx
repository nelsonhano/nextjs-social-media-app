import { Skeleton } from "../ui/skeleton";

export default function PostsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <PostLoadingSkeleton />
      <PostLoadingSkeleton />
      <PostLoadingSkeleton />
    </div>
  );
}

function PostLoadingSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-4 rounded-3xl glass-card p-4 sm:p-5 shadow-sm border border-white/40 dark:border-white/10">
      {/* Author header skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full bg-muted/60" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28 rounded-full bg-muted/60" />
            <Skeleton className="h-3 w-20 rounded-full bg-muted/60" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-full bg-muted/60" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-full bg-muted/60" />
        <Skeleton className="h-4 w-3/4 rounded-full bg-muted/60" />
      </div>

      {/* Media placeholder skeleton */}
      <Skeleton className="aspect-[16/9] w-full rounded-2xl bg-muted/50" />

      {/* Engagement badge counters skeleton */}
      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-full bg-muted/60" />
          <Skeleton className="h-7 w-24 rounded-full bg-muted/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full bg-muted/60" />
          <Skeleton className="size-8 rounded-full bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
