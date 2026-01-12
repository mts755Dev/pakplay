import { Metadata } from "next";
import { OwnerDashboardClient } from "@/components/pages/owner/OwnerDashboardClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchOwnerDashboard } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Owner Dashboard | PakPlay",
  description: "Manage your venues, bookings, and analytics.",
};

// Disable caching for auth-protected pages (always fresh data)
export const dynamic = 'force-dynamic';

// Server Component with SSR - Fetch data on server
export default async function OwnerDashboardPage() {
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
  
  // Fetch dashboard data on server
  const dashboardData = await fetchOwnerDashboard(userWithRole.user.id);
  
  // Pass data to client component
  return (
    <OwnerDashboardClient
      initialVenues={dashboardData.venues}
      initialStats={dashboardData.stats}
    />
  );
}

