export default function VenueDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Skeleton */}
      <div className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-12 w-32 bg-secondary/10 animate-pulse rounded" />
          <div className="hidden lg:flex items-center gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 bg-secondary/10 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="h-[400px] md:h-[500px] bg-secondary/10 animate-pulse" />

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-12 w-3/4 bg-secondary/10 animate-pulse rounded" />
            <div className="h-6 w-full bg-secondary/10 animate-pulse rounded" />
            <div className="h-6 w-full bg-secondary/10 animate-pulse rounded" />
            <div className="h-6 w-2/3 bg-secondary/10 animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-96 bg-secondary/10 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}





