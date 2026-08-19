import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="p-4 space-y-0">
      <div className="flex items-center gap-6 py-3 border-b border-border">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 py-3.5 border-b border-border last:border-0">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <Skeleton className="h-3.5 flex-[2]" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-6">
      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
      <div className="space-y-2.5 flex-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border bg-card">
      <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-3.5 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </div>
  );
}
