import { AdminNotificationsClient } from "@/components/pages/admin/AdminNotificationsClient";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function AdminNotificationsPage() {
  return <AdminNotificationsClient />;
}

