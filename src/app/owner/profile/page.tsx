import { Metadata } from "next";
import { OwnerProfileClient } from "@/components/pages/owner/OwnerProfileClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchOwnerProfileServer } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Profile | PakPlay",
  description: "Manage your personal information.",
};

export const dynamic = 'force-dynamic';

export default async function OwnerProfilePage() {
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

  const { profile, venues } = await fetchOwnerProfileServer(userWithRole.user.id);
  const venueStats = {
    total: venues.length,
    approved: venues.filter((v) => v.status === 'approved').length,
  };

  return (
    <OwnerProfileClient
      initialProfile={profile}
      initialVenueStats={venueStats}
      userEmail={userWithRole.user.email || ''}
      userId={userWithRole.user.id}
    />
  );
}
