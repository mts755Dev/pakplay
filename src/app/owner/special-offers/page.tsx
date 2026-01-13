import { OwnerSpecialOffersClient } from "@/components/pages/owner/OwnerSpecialOffersClient";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function OwnerSpecialOffersPage() {
  return <OwnerSpecialOffersClient />;
}

