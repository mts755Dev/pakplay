import { OwnerOnboardingClient } from "@/components/pages/owner/OwnerOnboardingClient";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function OwnerOnboardingPage() {
  return <OwnerOnboardingClient />;
}

