import { AdminReviewReportsClient } from "@/components/pages/admin/AdminReviewReportsClient";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function AdminReviewReportsPage() {
  return <AdminReviewReportsClient />;
}

