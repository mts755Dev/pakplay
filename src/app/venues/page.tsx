import { Metadata } from "next";
import VenuesPageClient from "@/components/pages/VenuesPageClient";
import { fetchInitialVenues } from "@/lib/server-actions";

export const metadata: Metadata = {
  title: "Browse Sports Venues | PakPlay",
  description: "Find and book the best sports venues across Pakistan. Football, Cricket, Badminton, Tennis and more.",
};

export const revalidate = 60;

// Server component with SSR
export default async function VenuesPage() {
  const { venues, totalCount } = await fetchInitialVenues(12);

  return (
    <VenuesPageClient 
      initialVenues={venues}
      initialTotalCount={totalCount}
    />
  );
}

