import { IndexPage } from "@/components/pages/IndexPage";
import { fetchFeaturedVenues, fetchAppStats, fetchTopSports } from "@/lib/server-actions";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

// Server component with SSR - Fetch all data in parallel
export default async function Home() {
  const [featuredVenues, appStats, topSports] = await Promise.all([
    fetchFeaturedVenues(9),
    fetchAppStats(),
    fetchTopSports(6),
  ]);
  
  return (
    <IndexPage 
      initialFeaturedVenues={featuredVenues}
      initialStats={appStats}
      initialSports={topSports}
    />
  );
}

