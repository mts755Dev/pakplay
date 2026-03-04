import { Metadata } from "next";
import { Suspense } from "react";
import OffersPageClient from "@/components/pages/OffersPageClient";
import { fetchInitialOffers } from "@/lib/server-actions";

// Revalidate every 60 seconds (ISR) — page is cached and served instantly,
// then refreshed in the background.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Special Offers - Best Deals on Sports Venues | PakPlay",
  description: "Browse exclusive offers and discounts on top sports venues across Pakistan. Save on cricket, football, futsal, pickleball, badminton & padel court bookings.",
};

export default async function OffersPage() {
  const { offers, totalCount } = await fetchInitialOffers();

  return (
    <Suspense>
      <OffersPageClient 
        initialOffers={offers}
        initialTotalCount={totalCount}
      />
    </Suspense>
  );
}
