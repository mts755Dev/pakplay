import { VenueDetailClient } from "@/components/pages/VenueDetailClient";
import {
  fetchVenueBySlug,
  fetchVenueLoyaltyTiers,
  fetchUserLoyaltyStatus,
} from "@/lib/server-actions";
import { resolvePlayerBookingDetails } from "@/lib/player-profile";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface PageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const venue = await fetchVenueBySlug(params.slug);

    if (!venue) {
      return {
        title: 'Venue Not Found | PakPlay',
      };
    }

    return {
      title: `${venue.name} | Book Now on PakPlay`,
      description: venue.description || `Book ${venue.name} on PakPlay - Pakistan's leading sports venue booking platform.`,
      keywords: [
        venue.name,
        venue.sport_type,
        `${venue.city} sports venue`,
        'venue booking Pakistan',
      ],
      openGraph: {
        title: venue.name,
        description: venue.description || `Book ${venue.name} on PakPlay`,
        type: 'website',
        images: venue.venue_photos?.[0]?.photo_url ? [venue.venue_photos[0].photo_url] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Venue | PakPlay',
    };
  }
}

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

// Server component with SSR
export default async function VenueDetailPage({ params }: PageProps) {
  const venueData = await fetchVenueBySlug(params.slug);

  if (!venueData) {
    notFound();
  }

  // Fetch loyalty data on server-side
  let loyaltyTiers = null;
  let loyaltyStatus = null;
  let currentUserEmail = null;
  let initialPlayerProfile: {
    fullName: string | null;
    phone: string | null;
    email: string | null;
  } | null = null;
  let initialIsOwner = false;

  try {
    // Get current user from server-side auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch loyalty tiers for this venue
    loyaltyTiers = await fetchVenueLoyaltyTiers(venueData.id);

    // If user is logged in, fetch their loyalty status
    // BUT skip if user is the venue owner (owners don't need loyalty status)
    if (user?.email) {
      currentUserEmail = user.email;
      initialIsOwner = venueData.owner_id === user.id;

      if (!initialIsOwner) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, whatsapp_number')
          .eq('id', user.id)
          .maybeSingle();

        initialPlayerProfile = resolvePlayerBookingDetails(profile, user);
        loyaltyStatus = await fetchUserLoyaltyStatus(venueData.id, user.email);
      }
    }
  } catch (error) {
    console.error('Error fetching loyalty data:', error);
    // Continue without loyalty data if there's an error
  }

  // Serialize data to ensure it's compatible with client components
  const serializedVenue = JSON.parse(JSON.stringify(venueData));
  const serializedLoyaltyTiers = loyaltyTiers ? JSON.parse(JSON.stringify(loyaltyTiers)) : null;
  const serializedLoyaltyStatus = loyaltyStatus ? JSON.parse(JSON.stringify(loyaltyStatus)) : null;

  return (
    <VenueDetailClient 
      slug={params.slug}
      initialVenue={serializedVenue}
      initialReviews={serializedVenue.reviews || []}
      initialActiveOffer={serializedVenue.active_offer || null}
      initialLoyaltyTiers={serializedLoyaltyTiers}
      initialLoyaltyStatus={serializedLoyaltyStatus}
      initialUserEmail={currentUserEmail}
      initialPlayerProfile={initialPlayerProfile}
      initialIsOwner={initialIsOwner}
    />
  );
}
