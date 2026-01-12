import { Metadata } from "next";
import { OwnerAnalyticsClient } from "@/components/pages/owner/OwnerAnalyticsClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchOwnerAnalytics } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Analytics | PakPlay",
  description: "View your venue performance and analytics.",
};

export const dynamic = 'force-dynamic';

export default async function OwnerAnalyticsPage() {
  const userWithRole = await getServerUserWithRole();
  
  if (!userWithRole || !userWithRole.user) {
    redirect('/signin');
  }
  
  if (userWithRole.role === 'admin') {
    redirect('/admin/dashboard');
  }
  
  if (userWithRole.role !== 'venue_owner') {
    redirect('/');
  }
  
  const analyticsData = await fetchOwnerAnalytics(userWithRole.user.id);
  
  return <OwnerAnalyticsClient initialData={analyticsData} />;
}

