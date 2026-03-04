import { Metadata } from "next";
import { Suspense } from "react";
import VenuesPageClient from "@/components/pages/VenuesPageClient";
import { fetchInitialVenues } from "@/lib/server-actions";

export const metadata: Metadata = {
  title: "Browse Sports Venues | PakPlay",
  description: "Find and book the best sports venues across Pakistan. Football, Cricket, Badminton, Tennis and more.",
};

// Revalidate every 60 seconds (ISR) — page is cached and served instantly,
// then refreshed in the background. No more blocking DB queries on every visit.
export const revalidate = 60;

// Server component with SSR
export default async function VenuesPage() {
  const { venues, totalCount } = await fetchInitialVenues(12);

  return (
    <Suspense>
      <VenuesPageClient 
        initialVenues={venues}
        initialTotalCount={totalCount}
      />
    </Suspense>
  );
}

