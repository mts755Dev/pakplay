import { Metadata } from "next";
import { OwnerOnboardingClient } from "@/components/pages/owner/OwnerOnboardingClient";

export const metadata: Metadata = {
  title: "List Your Venue | PakPlay",
  description: "Add your sports venue to PakPlay and start receiving bookings.",
};

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function OwnerListVenuePage() {
  return <OwnerOnboardingClient />;
}

