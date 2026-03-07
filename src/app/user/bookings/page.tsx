import { Metadata } from "next";
import { Suspense } from "react";
import { UserBookingsClient } from "@/components/pages/user/UserBookingsClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Bookings | PakPlay",
  description: "View and manage your venue bookings.",
};

export const dynamic = 'force-dynamic';

// Server Component with SSR
export default async function UserBookingsPage() {
  // We remove the server-side auth check to allow immediate rendering of the client component
  // The client component handles authentication state and data fetching securely
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserBookingsClient />
    </Suspense>
  );
}
