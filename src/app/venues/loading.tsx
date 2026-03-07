import { VenueGridSkeleton } from "@/components/loading/VenueCardSkeleton";

export default function VenuesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Skeleton */}
      <div className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-12 w-32 bg-secondary/10 animate-pulse rounded" />
          <div className="hidden lg:flex items-center gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-secondary/10 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-10 w-64 bg-secondary/10 animate-pulse rounded mb-2" />
          <div className="h-6 w-96 bg-secondary/10 animate-pulse rounded" />
        </div>

        {/* Filters Skeleton */}
        <div className="mb-6 space-y-4">
          <div className="h-12 bg-secondary/10 animate-pulse rounded" />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-32 bg-secondary/10 animate-pulse rounded" />
            ))}
          </div>
        </div>

        {/* Venue Grid Skeleton */}
        <VenueGridSkeleton count={12} />
      </div>
    </div>
  );
}
