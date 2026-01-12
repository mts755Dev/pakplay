import { AdminAnalyticsClient } from "@/components/pages/admin/AdminAnalyticsClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchAdminAnalytics } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const userWithRole = await getServerUserWithRole();
  
  if (!userWithRole || !userWithRole.user) {
    redirect('/signin');
  }
  
  if (userWithRole.role !== 'admin') {
    redirect('/');
  }
  
  const analyticsData = await fetchAdminAnalytics();
  
  return <AdminAnalyticsClient initialData={analyticsData} />;
}

