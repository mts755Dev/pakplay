import { OwnerSettingsClient } from "@/components/pages/owner/OwnerSettingsClient";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function OwnerSettingsPage() {
  return <OwnerSettingsClient />;
}

