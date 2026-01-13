import { VenueDetailClient } from "@/components/pages/VenueDetailClient";
import { fetchVenueBySlug } from "@/lib/server-actions";
import { notFound } from "next/navigation";
import { Metadata } from "next";

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

  // Serialize data to ensure it's compatible with client components
  const serializedVenue = JSON.parse(JSON.stringify(venueData));

  return (
    <VenueDetailClient 
      slug={params.slug}
      initialVenue={serializedVenue}
      initialReviews={serializedVenue.reviews || []}
      initialActiveOffer={serializedVenue.active_offer || null}
    />
  );
}
