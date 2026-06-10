import { Metadata } from "next";
import { OwnerSpecialOffersClient } from "@/components/pages/owner/OwnerSpecialOffersClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchOwnerOffersServer, fetchOwnerVenuesServer } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Special Offers | PakPlay",
  description: "Create and manage promotional offers for your venues.",
};

export const dynamic = 'force-dynamic';

export default async function OwnerSpecialOffersPage() {
  const userWithRole = await getServerUserWithRole();

  if (!userWithRole?.user) {
    redirect('/signin');
  }

  if (userWithRole.role === 'admin') {
    redirect('/admin/dashboard');
  }

  if (userWithRole.role !== 'venue_owner') {
    redirect('/');
  }

  const [venuesResult, offersResult] = await Promise.all([
    fetchOwnerVenuesServer(userWithRole.user.id),
    fetchOwnerOffersServer(userWithRole.user.id),
  ]);

  return (
    <OwnerSpecialOffersClient
      initialVenues={venuesResult.data}
      initialOffers={offersResult.data}
      userId={userWithRole.user.id}
    />
  );
}
