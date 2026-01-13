import { OwnerVenueEditClient } from "@/components/pages/owner/OwnerVenueEditClient";
import { getServerUserWithRole } from "@/lib/auth-server";
import { fetchVenueForEdit } from "@/lib/server-actions";
import { redirect, notFound } from "next/navigation";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

// Server Component with SSR - Fetch venue data on server
export default async function OwnerVenueEditPage({ params }: PageProps) {
  // Check authentication on server
  const userWithRole = await getServerUserWithRole();
  
  if (!userWithRole || !userWithRole.user) {
    redirect('/signin');
  }
  
  // Check role authorization
  if (userWithRole.role === 'admin') {
    redirect('/admin/dashboard');
  }
  
  if (userWithRole.role !== 'venue_owner') {
    redirect('/');
  }
  
  // Fetch venue data on server
  const venueData = await fetchVenueForEdit(params.id, userWithRole.user.id);
  
  if (!venueData) {
    notFound();
  }
  
  // Pass data to client component
  return (
    <OwnerVenueEditClient
      venueId={params.id}
      initialVenue={venueData}
    />
  );
}

