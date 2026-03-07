import { Metadata } from "next";
import OffersPageClient from "@/components/pages/OffersPageClient";
import { fetchInitialOffers } from "@/lib/server-actions";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Special Offers - Best Deals on Sports Venues | PakPlay",
  description: "Browse exclusive offers and discounts on top sports venues across Pakistan. Save on cricket, football, futsal, pickleball, badminton & padel court bookings.",
};

export default async function OffersPage() {
  const { offers, totalCount } = await fetchInitialOffers();

  return (
    <OffersPageClient 
      initialOffers={offers}
      initialTotalCount={totalCount}
    />
  );
}
