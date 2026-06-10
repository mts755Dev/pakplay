import { Metadata } from "next";
import { OwnerSettingsClient } from "@/components/pages/owner/OwnerSettingsClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchOwnerVenuesForSettings } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings | PakPlay",
  description: "Manage your account settings and security.",
};

export const dynamic = 'force-dynamic';

export default async function OwnerSettingsPage() {
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

  const { data: venues } = await fetchOwnerVenuesForSettings(userWithRole.user.id);

  return (
    <OwnerSettingsClient
      initialVenues={venues}
      userId={userWithRole.user.id}
    />
  );
}
