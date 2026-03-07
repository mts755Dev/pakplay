import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function UserBookingsLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 w-48 bg-secondary/10 animate-pulse rounded" />
      </div>

      <div className="flex gap-2 mb-6">
        <div className="h-10 w-24 bg-secondary/10 animate-pulse rounded" />
        <div className="h-10 w-24 bg-secondary/10 animate-pulse rounded" />
        <div className="h-10 w-24 bg-secondary/10 animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 h-48 bg-secondary/10 animate-pulse rounded-lg" />
              <div className="flex-1 space-y-4">
                <div className="h-6 w-3/4 bg-secondary/10 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-secondary/10 animate-pulse rounded" />
                <div className="h-4 w-1/3 bg-secondary/10 animate-pulse rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
