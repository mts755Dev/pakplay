import { Metadata } from "next";
import { OwnerOnboardingClient } from "@/components/pages/owner/OwnerOnboardingClient";

export const metadata: Metadata = {
  title: "List Your Venue | PakPlay",
  description: "Add your sports venue to PakPlay and start receiving bookings.",
};

export default function OwnerListVenuePage() {
  return <OwnerOnboardingClient />;
}

