import { Skeleton } from '../components/ui/Skeleton';

export function RouteFallback() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas" role="status" aria-label="Loading">
      <div className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
        <Skeleton className="size-7" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-1 items-start justify-center p-10">
        <Skeleton className="aspect-[210/297] w-full max-w-[520px] rounded-none" />
      </div>
    </div>
  );
}
