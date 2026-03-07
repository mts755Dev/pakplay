export default function HomeLoading() {
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

      {/* Hero Skeleton */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="h-16 w-3/4 bg-secondary/10 animate-pulse rounded" />
            <div className="h-6 w-full bg-secondary/10 animate-pulse rounded" />
            <div className="h-6 w-full bg-secondary/10 animate-pulse rounded" />
            <div className="flex gap-4">
              <div className="h-12 w-32 bg-secondary/10 animate-pulse rounded" />
              <div className="h-12 w-32 bg-secondary/10 animate-pulse rounded" />
            </div>
          </div>
          <div className="h-96 bg-secondary/10 animate-pulse rounded-2xl" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-12 w-64 bg-secondary/10 animate-pulse rounded mx-auto mb-4" />
            <div className="h-6 w-96 bg-secondary/10 animate-pulse rounded mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="h-96 bg-secondary/10 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
