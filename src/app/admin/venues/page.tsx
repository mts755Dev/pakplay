import { Metadata } from "next";
import { AdminVenuesClient } from "@/components/pages/admin/AdminVenuesClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchAdminVenues } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Manage Venues | Admin | PakPlay",
  description: "Approve, reject, and manage venue listings.",
};

export const dynamic = 'force-dynamic';

export default async function AdminVenuesPage() {
  const userWithRole = await getServerUserWithRole();
  
  if (!userWithRole || !userWithRole.user) {
    redirect('/signin');
  }
  
  if (userWithRole.role !== 'admin') {
    redirect('/');
  }
  
  const venues = await fetchAdminVenues();
  
  return <AdminVenuesClient initialVenues={venues} />;
}

