import { Metadata } from "next";
import { Suspense } from "react";
import { OwnerBookingsClient } from "@/components/pages/owner/OwnerBookingsClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchOwnerBookings } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Bookings | PakPlay",
  description: "View and manage your venue bookings.",
};

export const dynamic = 'force-dynamic';

// Server Component with SSR
export default async function OwnerBookingsPage() {
  const userWithRole = await getServerUserWithRole();
  
  if (!userWithRole || !userWithRole.user) {
    redirect('/signin');
  }
  
  if (userWithRole.role === 'admin') {
    redirect('/admin/dashboard');
  }
  
  if (userWithRole.role !== 'venue_owner') {
    redirect('/');
  }
  
  // Fetch bookings server-side
  const bookings = await fetchOwnerBookings(userWithRole.user.id);
  
  // Ensure we always pass an array
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OwnerBookingsClient initialBookings={safeBookings} />
    </Suspense>
  );
}

