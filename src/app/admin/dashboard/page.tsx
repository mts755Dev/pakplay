import { Metadata } from "next";
import { AdminDashboardClient } from "@/components/pages/admin/AdminDashboardClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchAdminDashboard } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard | PakPlay",
  description: "Manage platform, users, and venues.",
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const userWithRole = await getServerUserWithRole();
  
  if (!userWithRole || !userWithRole.user) {
    redirect('/signin');
  }
  
  if (userWithRole.role !== 'admin') {
    redirect('/');
  }
  
  const dashboardData = await fetchAdminDashboard();
  
  return <AdminDashboardClient initialStats={dashboardData} />;
}

