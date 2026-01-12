import { AdminUsersClient } from "@/components/pages/admin/AdminUsersClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchAdminUsers } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const userWithRole = await getServerUserWithRole();
  
  if (!userWithRole || !userWithRole.user) {
    redirect('/signin');
  }
  
  if (userWithRole.role !== 'admin') {
    redirect('/');
  }
  
  const users = await fetchAdminUsers();
  
  return <AdminUsersClient initialUsers={users} />;
}

