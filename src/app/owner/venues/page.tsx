import { Metadata } from "next";
import { OwnerVenuesClient } from "@/components/pages/owner/OwnerVenuesClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchOwnerDashboard } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Venues | PakPlay",
  description: "Manage your sports venues listings.",
};

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

// Server Component with SSR - Fetch data on server
export default async function OwnerVenuesPage() {
  // Check authentication on server
  const userWithRole = await getServerUserWithRole();
  
  if (!userWithRole || !userWithRole.user) {
    redirect('/signin');
  }
  
  // Check role authorization
  if (userWithRole.role === 'admin') {
    redirect('/admin/dashboard');
  }
  
  if (userWithRole.role !== 'venue_owner') {
    redirect('/');
  }
  
  // Fetch venues data on server
  const dashboardData = await fetchOwnerDashboard(userWithRole.user.id);
  
  // Pass data to client component
  return (
    <OwnerVenuesClient
      initialVenues={dashboardData.venues}
      userId={userWithRole.user.id}
    />
  );
}

