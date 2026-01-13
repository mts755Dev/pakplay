import { OwnerProfileClient } from "@/components/pages/owner/OwnerProfileClient";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function OwnerProfilePage() {
  return <OwnerProfileClient />;
}

