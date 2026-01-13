import { AdminSettingsClient } from "@/components/pages/admin/AdminSettingsClient";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}

