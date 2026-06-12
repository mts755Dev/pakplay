import { Metadata } from "next";
import { Suspense } from "react";
import { format, isValid, parseISO } from "date-fns";
import { OwnerBookingsClient } from "@/components/pages/owner/OwnerBookingsClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { autoCompleteOwnerBookings, fetchOwnerBookingsServer } from "@/lib/server-actions";
import { redirect } from "next/navigation";

function getTodayDateKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function isValidDateFilter(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return isValid(parseISO(value));
}

export const metadata: Metadata = {
  title: "Bookings | PakPlay",
  description: "View and manage your venue bookings.",
};

export const dynamic = 'force-dynamic';

// Server Component with SSR
export default async function OwnerBookingsPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  if (!isValidDateFilter(searchParams?.date)) {
    redirect(`/owner/bookings?date=${getTodayDateKey()}`);
  }

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
  
  await autoCompleteOwnerBookings(userWithRole.user.id);
  const { data: bookings } = await fetchOwnerBookingsServer(userWithRole.user.id);
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OwnerBookingsClient initialBookings={safeBookings} userId={userWithRole.user.id} />
    </Suspense>
  );
}

