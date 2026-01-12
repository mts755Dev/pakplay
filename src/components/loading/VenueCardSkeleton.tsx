import { Card } from "@/components/ui/card";

export function VenueCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <div className="h-40 sm:h-48 bg-secondary/10 animate-pulse" />
      <div className="p-4 sm:p-6 space-y-3">
        <div className="h-6 bg-secondary/10 animate-pulse rounded" />
        <div className="h-4 bg-secondary/10 animate-pulse rounded w-3/4" />
        <div className="h-4 bg-secondary/10 animate-pulse rounded w-1/2" />
        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="h-8 bg-secondary/10 animate-pulse rounded w-24" />
          <div className="h-10 bg-secondary/10 animate-pulse rounded w-24" />
        </div>
      </div>
    </Card>
  );
}

export function VenueGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VenueCardSkeleton key={i} />
      ))}
    </div>
  );
}





