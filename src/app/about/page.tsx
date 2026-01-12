import { Metadata } from "next";
import { AboutUsPageContent } from "@/components/pages/AboutUsPageContent";
import { fetchAppStats } from "@/lib/server-actions";

export const metadata: Metadata = {
  title: "About PakPlay | Pakistan's #1 Sports Venue Booking Platform",
  description: "Learn about PakPlay - Pakistan's leading sports venue booking platform connecting players with quality facilities across the country. Our mission is to make sports accessible for everyone.",
  keywords: ["about pakplay", "sports venue platform", "pakistan sports booking", "sports facility booking"],
  openGraph: {
    title: "About PakPlay | Pakistan's #1 Sports Venue Booking Platform",
    description: "Pakistan's leading sports venue booking platform connecting players with quality facilities.",
    type: "website",
  },
};

// Server component with SSR
export default async function AboutPage() {
  const stats = await fetchAppStats();
  
  return <AboutUsPageContent initialStats={stats} />;
}

