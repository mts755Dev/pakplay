import { Metadata } from "next";
import { PricingPageContent } from "@/components/pages/PricingPageContent";

export const metadata: Metadata = {
  title: "Pricing & Plans | List Your Sports Venue on PakPlay",
  description: "Simple, transparent pricing for venue owners. Start listing your sports facility today with no upfront costs. Pay only when you get bookings.",
  keywords: ["venue pricing", "sports facility listing", "venue owner plans", "sports venue marketing"],
  openGraph: {
    title: "Pricing & Plans | PakPlay",
    description: "Simple, transparent pricing for venue owners. Start listing your sports facility today.",
    type: "website",
  },
};

// Server Component - SSR by default
export default function PricingPage() {
  return <PricingPageContent />;
}

