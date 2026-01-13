import { AdminContactsClient } from "@/components/pages/admin/AdminContactsClient";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function AdminContactsPage() {
  return <AdminContactsClient />;
}

