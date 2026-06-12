// Server-side data fetching utilities for SSR
// These are NOT hooks - they're server-only functions
"use server";

import { supabaseServer } from './supabase-server';
import { getOwnerActionSupabase } from './supabase-owner';
import { bookingToInterval, getCourtAvailability } from './court-availability';
import { resolvePlayerBookingDetails } from './player-profile';
import { Tables, Database } from '@/integrations/supabase/types';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type Venue = Tables<'venues'>;
type VenuePhoto = Tables<'venue_photos'>;
type VenueReview = Tables<'venue_reviews'>;
type SpecialOffer = Tables<'special_offers'>;

// ==================== IN-MEMORY SERVER CACHE ====================
// Caches DB results in the Node.js process memory so repeated navigations
// (especially in dev mode where ISR is inactive) return data near-instantly.
const serverCache = new Map<string, { data: any; expires: number }>();

async function withCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const entry = serverCache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  const data = await fetcher();
  serverCache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
  return data;
}

// ==================== VENUE DATA FETCHING ====================

export interface VenueWithData extends Venue {
  venue_photos: VenuePhoto[];
  active_offer?: SpecialOffer | null;
  calculated_rating?: number;
  review_count?: number;
  reviews?: VenueReview[];
}

/**
 * Fetch a single venue by slug with all related data
 */
export async function fetchVenueBySlug(slug: string): Promise<VenueWithData | null> {
  try {
    const { data: venue, error } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();

    if (error || !venue) return null;

    venue.venue_photos.sort((a, b) => a.display_order - b.display_order);

    const [reviewsResult, offerResult] = await Promise.all([
      supabaseServer
        .from('venue_reviews')
        .select('*')
        .eq('venue_id', venue.id)
        .order('date', { ascending: false }),
      supabaseServer
        .from('special_offers')
        .select('*')
        .eq('venue_id', venue.id)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    return {
      ...venue,
      reviews: reviewsResult.data || [],
      active_offer: offerResult.data || null,
      calculated_rating: reviewsResult.data && reviewsResult.data.length > 0
        ? reviewsResult.data.reduce((acc, r) => acc + r.rating, 0) / reviewsResult.data.length
        : 0,
      review_count: reviewsResult.data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching venue:', error);
    return null;
  }
}

/**
 * Fetch featured venues for homepage
 */
export async function fetchFeaturedVenues(limit: number = 9): Promise<VenueWithData[]> {
  try {
    const { data, error } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('status', 'approved')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    const venueIds = data.map(v => v.id);
    if (venueIds.length === 0) return [];

    const [offersResult, reviewsResult] = await Promise.all([
      supabaseServer
        .from('special_offers')
        .select('*')
        .in('venue_id', venueIds)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString()),
      supabaseServer
        .from('venue_reviews')
        .select('venue_id, rating')
        .in('venue_id', venueIds)
    ]);

    const offersMap = new Map<string, SpecialOffer>();
    (offersResult.data || []).forEach(offer => {
      if (!offersMap.has(offer.venue_id)) {
        offersMap.set(offer.venue_id, offer);
      }
    });

    const ratingsMap = new Map<string, { total: number; count: number }>();
    (reviewsResult.data || []).forEach(review => {
      if (!ratingsMap.has(review.venue_id)) {
        ratingsMap.set(review.venue_id, { total: 0, count: 0 });
      }
      const current = ratingsMap.get(review.venue_id)!;
      current.total += review.rating;
      current.count += 1;
    });

    const venuesWithData = data.map(venue => {
      const offer = offersMap.get(venue.id);
      const rating = ratingsMap.get(venue.id);

      return {
        ...venue,
        active_offer: offer || null,
        calculated_rating: rating ? rating.total / rating.count : 0,
        review_count: rating ? rating.count : 0,
      };
    });

    venuesWithData.sort((a, b) => b.calculated_rating - a.calculated_rating);
    return venuesWithData;
  } catch (error) {
    console.error('Error fetching featured venues:', error);
    return [];
  }
}

/**
 * Fetch initial venues for browse page (cached 60s in-memory)
 */
export async function fetchInitialVenues(limit: number = 12) {
  return withCache(`initial-venues-${limit}`, 60, () => _fetchInitialVenuesImpl(limit));
}

async function _fetchInitialVenuesImpl(limit: number) {
  try {
    // Single query with embedded relations — 1 HTTP round-trip instead of 4
    const { data: venues, error, count } = await supabaseServer
      .from('venues')
      .select(`
        id, name, slug, subdomain, address, city, province, area, sub_area,
        sport_type, price_per_hour, opening_time, closing_time, is_24_7, created_at,
        owner_id, description, amenities, whatsapp_number, google_maps_url, is_featured,
        status, featured, rating, total_bookings, updated_at,
        logo_url, tagline, facebook_url, instagram_url,
        venue_photos(id, venue_id, photo_url, is_primary, display_order, created_at),
        venue_reviews(venue_id, rating),
        special_offers(id, venue_id, offer_name, description, original_price, offer_price, discount_percentage, valid_from, valid_until, is_active, created_at, updated_at)
      `, { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    if (error) {
      return { venues: [], totalCount: 0 };
    }

    if (!venues || venues.length === 0) {
      return { venues: [], totalCount: 0 };
    }

    const now = new Date().toISOString();

    const venuesWithData = venues.map((venue: any) => {
      const photos: VenuePhoto[] = venue.venue_photos || [];
      const reviews: { venue_id: string; rating: number }[] = venue.venue_reviews || [];

      // Find active offer (filter by is_active + date range in JS — avoids extra query)
      const activeOffer = (venue.special_offers || []).find((o: any) =>
        o.is_active && o.valid_from <= now && o.valid_until >= now
      ) || null;

      // Calculate average rating
      const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      // Remove embedded relations from the spread, add processed fields
      const { venue_photos, venue_reviews, special_offers, ...venueBase } = venue;

      return {
        ...venueBase,
        venue_photos: photos,
        active_offer: activeOffer,
        calculated_rating: avgRating,
        review_count: reviews.length,
      };
    });

    return {
      venues: venuesWithData,
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('Error fetching initial venues:', error);
    return { venues: [], totalCount: 0 };
  }
}

/**
 * Fetch initial offers for offers page (cached 60s in-memory)
 */
export async function fetchInitialOffers(limit: number = 12) {
  return withCache(`initial-offers-${limit}`, 60, () => _fetchInitialOffersImpl(limit));
}

async function _fetchInitialOffersImpl(limit: number) {
  try {
    const { data: offers, error, count } = await supabaseServer
      .from('special_offers')
      .select(`
        *,
        venues!inner(
          id, owner_id, name, slug, sport_type, city, province, area, sub_area,
          address, description, amenities, price_per_hour, opening_time, closing_time,
          is_24_7, whatsapp_number, google_maps_url, status,
          featured, rating, total_bookings, logo_url, tagline, facebook_url,
          instagram_url, created_at, updated_at,
          venue_photos(id, venue_id, photo_url, is_primary, display_order),
          venue_reviews(venue_id, rating)
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .eq('venues.status', 'approved')
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    if (error || !offers) {
      console.error('Error fetching initial offers:', error);
      return { offers: [], totalCount: 0 };
    }

    const offersWithData = offers.map((offer: any) => {
      const venue = offer.venues;
      const photos = venue.venue_photos || [];
      const reviews = venue.venue_reviews || [];
      const calculatedRating = reviews.length > 0
        ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length
        : 0;

      return {
        ...offer,
        venues: {
          ...venue,
          venue_photos: photos,
          calculated_rating: calculatedRating,
          review_count: reviews.length,
        },
      };
    });

    return {
      offers: offersWithData,
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('Error fetching initial offers:', error);
    return { offers: [], totalCount: 0 };
  }
}

// ==================== STATISTICS FETCHING ====================

/**
 * Fetch app statistics for landing page
 */
export async function fetchAppStats() {
  try {
    const [venuesResult, citiesResult] = await Promise.all([
      supabaseServer
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),
      supabaseServer
        .from('venues')
        .select('city')
        .eq('status', 'approved')
    ]);

    const uniqueCities = new Set(citiesResult.data?.map(v => v.city).filter(Boolean) || []);

    return {
      totalVenues: venuesResult.count || 0,
      totalBookings: 10000,
      totalUsers: "50K",
      totalCities: uniqueCities.size,
    };
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return {
      totalVenues: 0,
      totalBookings: 0,
      totalUsers: 0,
      totalCities: 0,
    };
  }
}

// ==================== TESTIMONIALS FETCHING ====================

/**
 * Fetch testimonials for landing page
 */
export async function fetchTestimonials() {
  try {
    const { data, error } = await supabaseServer
      .from('venue_reviews')
      .select('*, venues!inner(name)')
      .gte('rating', 4)
      .order('date', { ascending: false })
      .limit(6);

    if (error) return [];
    return data || [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

// ==================== SPORTS CATEGORIES FETCHING ====================

export interface SportCount {
  name: string;
  sport_type: string;
  count: number;
}

/**
 * Fetch top sports by venue count
 */
export async function fetchTopSports(limit: number = 3): Promise<SportCount[]> {
  try {
    const { data, error } = await supabaseServer
      .from('venues')
      .select('sport_type')
      .eq('status', 'approved');
    
    if (error || !data) return [];

    // Count venues by sport type
    const counts: Record<string, number> = {};
    data.forEach((venue) => {
      counts[venue.sport_type] = (counts[venue.sport_type] || 0) + 1;
    });

    // Convert to array and sort by count (descending)
    const sortedSports = Object.entries(counts)
      .filter(([sport]) => sport !== 'football') // Exclude football since futsal is already shown
      .map(([sport, count]) => ({
        name: sport.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        sport_type: sport,
        count: count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sortedSports;
  } catch (error) {
    console.error('Error fetching top sports:', error);
    return [];
  }
}

// ==================== OWNER DASHBOARD FETCHING ====================

export interface OwnerDashboardData {
  venues: Array<Venue & { venue_photos: VenuePhoto[] }>;
  stats: {
    totalVenues: number;
    approvedVenues: number;
    pendingVenues: number;
    totalBookings: number;
  };
}

/**
 * Fetch owner dashboard data (venues + stats)
 */
export async function fetchOwnerDashboard(userId: string): Promise<OwnerDashboardData> {
  try {
    // Fetch venues with photos
    const { data: venues, error: venuesError } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (venuesError) {
      console.error('Error fetching owner venues:', venuesError);
      return {
        venues: [],
        stats: { totalVenues: 0, approvedVenues: 0, pendingVenues: 0, totalBookings: 0 }
      };
    }

    const venueData = venues || [];

    // Calculate stats
    const approved = venueData.filter(v => v.status === 'approved').length;
    const pending = venueData.filter(v => v.status === 'pending').length;
    const totalBookings = venueData.reduce((sum, v) => sum + (v.total_bookings || 0), 0);

    return {
      venues: venueData,
      stats: {
        totalVenues: venueData.length,
        approvedVenues: approved,
        pendingVenues: pending,
        totalBookings,
      }
    };
  } catch (error) {
    console.error('Error fetching owner dashboard:', error);
    return {
      venues: [],
      stats: { totalVenues: 0, approvedVenues: 0, pendingVenues: 0, totalBookings: 0 }
    };
  }
}

/**
 * Fetch reviews and report statuses for an owner's venue
 */
export async function fetchVenueReviewsForOwner(venueId: string, userId: string) {
  try {
    const supabase = await getOwnerActionSupabase();
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('id', venueId)
      .eq('owner_id', userId)
      .maybeSingle();

    if (venueError || !venue) {
      return { reviews: [], reportStatuses: {} as Record<string, string>, error: 'Venue not found' };
    }

    const [reviewsResult, reportsResult] = await Promise.all([
      supabase
        .from('venue_reviews')
        .select('*')
        .eq('venue_id', venueId)
        .order('date', { ascending: false }),
      supabase
        .from('review_reports')
        .select('review_id, status')
        .eq('venue_id', venueId)
        .eq('reporter_id', userId),
    ]);

    const reportStatuses: Record<string, string> = {};
    (reportsResult.data || []).forEach((r) => {
      reportStatuses[r.review_id] = r.status;
    });

    return {
      reviews: reviewsResult.data || [],
      reportStatuses,
      error: reviewsResult.error?.message || null,
    };
  } catch (error: any) {
    console.error('Error fetching venue reviews:', error);
    return { reviews: [], reportStatuses: {} as Record<string, string>, error: error.message };
  }
}

/**
 * Fetch a specific venue for editing (includes photos and pricing rules)
 */
export async function fetchVenueForEdit(venueId: string, userId: string) {
  try {
    const supabase = await getOwnerActionSupabase();
    const { data: venueData, error } = await supabase
      .from('venues')
      .select('*, venue_photos(*), venue_pricing_rules(*)')
      .eq('id', venueId)
      .eq('owner_id', userId)
      .maybeSingle();

    if (error || !venueData) {
      return null;
    }

    return venueData;
  } catch (error) {
    console.error('Error fetching venue for edit:', error);
    return null;
  }
}

export type OwnerVenueUpdateInput = {
  name: string;
  sport_type: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel';
  province: string | null;
  city: string;
  area: string | null;
  sub_area: string | null;
  address: string;
  description: string;
  amenities: string[] | null;
  price_per_hour: number;
  number_of_courts: number;
  opening_time: string | null;
  closing_time: string | null;
  is_24_7: boolean;
  whatsapp_number: string;
  logo_url: string | null;
  tagline: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  google_maps_url: string | null;
};

export type OwnerPricingRuleInput = {
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  price: string;
};

/**
 * Update an owner's venue (DB writes via authenticated server client)
 */
export async function updateOwnerVenue(
  userId: string,
  venueId: string,
  venueData: OwnerVenueUpdateInput,
  options: {
    photosToDelete: string[];
    newPhotoUrls: string[];
    remainingPhotoCount: number;
    pricingRules: OwnerPricingRuleInput[];
    loyaltyTiers: Array<{ tier_name: string; min_bookings: number; discount_percent: number }>;
  }
) {
  try {
    const venueAccess = await verifyOwnerVenueAccess(venueId, userId);
    if (!venueAccess.ok) {
      return { success: false, error: venueAccess.error };
    }

    const supabase = await getOwnerActionSupabase();

    const { error: venueError } = await supabase
      .from('venues')
      .update(venueData)
      .eq('id', venueId);

    if (venueError) {
      return { success: false, error: venueError.message };
    }

    if (options.photosToDelete.length > 0) {
      const { error } = await supabase
        .from('venue_photos')
        .delete()
        .in('id', options.photosToDelete)
        .eq('venue_id', venueId);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    if (options.newPhotoUrls.length > 0) {
      const photoInserts = options.newPhotoUrls.map((url, index) => ({
        venue_id: venueId,
        photo_url: url,
        is_primary: options.remainingPhotoCount === 0 && index === 0,
        display_order: options.remainingPhotoCount + index,
      }));

      const { error } = await supabase.from('venue_photos').insert(photoInserts);
      if (error) {
        return { success: false, error: error.message };
      }
    }

    const { error: deleteRulesError } = await supabase
      .from('venue_pricing_rules')
      .delete()
      .eq('venue_id', venueId);

    if (deleteRulesError) {
      return { success: false, error: deleteRulesError.message };
    }

    if (options.pricingRules.length > 0) {
      const pricingInserts: Array<{
        venue_id: string;
        day_of_week: number | null;
        start_time: string | null;
        end_time: string | null;
        price_per_hour: number;
        priority: number;
      }> = [];

      options.pricingRules.forEach((rule, index) => {
        if (rule.daysOfWeek.length === 0) {
          pricingInserts.push({
            venue_id: venueId,
            day_of_week: null,
            start_time: rule.startTime || null,
            end_time: rule.endTime || null,
            price_per_hour: parseFloat(rule.price),
            priority: index,
          });
        } else {
          rule.daysOfWeek.forEach((day) => {
            pricingInserts.push({
              venue_id: venueId,
              day_of_week: parseInt(day, 10),
              start_time: rule.startTime || null,
              end_time: rule.endTime || null,
              price_per_hour: parseFloat(rule.price),
              priority: index,
            });
          });
        }
      });

      if (pricingInserts.length > 0) {
        const { error } = await supabase
          .from('venue_pricing_rules')
          .insert(pricingInserts as never);
        if (error) {
          return { success: false, error: error.message };
        }
      }
    }

    const loyaltyResult = await saveVenueLoyaltyTiers(venueId, options.loyaltyTiers);
    if (loyaltyResult.error) {
      return { success: false, error: loyaltyResult.error };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating owner venue:', error);
    return { success: false, error: error.message || 'Failed to update venue' };
  }
}

export async function createVenuePhotoUploadUrl(
  userId: string,
  venueId: string,
  fileName: string,
  contentType: string,
  index = 0
) {
  try {
    const venueAccess = await verifyOwnerVenueAccess(venueId, userId);
    if (!venueAccess.ok) {
      return { signedUrl: null, publicUrl: null, error: venueAccess.error };
    }

    const supabase = await getOwnerActionSupabase();
    const fileExt = fileName.split('.').pop() || 'jpg';
    const storagePath = `${userId}/${venueId}/${Date.now()}_${index}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('venue-photos')
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      return { signedUrl: null, publicUrl: null, error: error?.message || 'Failed to create upload URL' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venue-photos')
      .getPublicUrl(storagePath);

    return { signedUrl: data.signedUrl, publicUrl, error: null };
  } catch (error: any) {
    console.error('Error creating venue photo upload URL:', error);
    return { signedUrl: null, publicUrl: null, error: error.message || 'Failed to create upload URL' };
  }
}

export async function createVenueLogoUploadUrl(
  userId: string,
  venueId: string,
  fileName: string,
  contentType: string
) {
  try {
    const venueAccess = await verifyOwnerVenueAccess(venueId, userId);
    if (!venueAccess.ok) {
      return { signedUrl: null, publicUrl: null, error: venueAccess.error };
    }

    const supabase = await getOwnerActionSupabase();
    const fileExt = fileName.split('.').pop() || 'png';
    const storagePath = `${userId}/${venueId}/logo.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('venue-logos')
      .createSignedUploadUrl(storagePath, { upsert: true });

    if (error || !data?.signedUrl) {
      return { signedUrl: null, publicUrl: null, error: error?.message || 'Failed to create upload URL' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venue-logos')
      .getPublicUrl(storagePath);

    return { signedUrl: data.signedUrl, publicUrl, error: null };
  } catch (error: any) {
    console.error('Error creating venue logo upload URL:', error);
    return { signedUrl: null, publicUrl: null, error: error.message || 'Failed to create upload URL' };
  }
}

/**
 * Verify a booking belongs to one of the owner's venues
 */
async function verifyOwnerBookingAccess(bookingId: string, userId: string) {
  const supabase = await getOwnerActionSupabase();
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, venue_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !booking) {
    return { ok: false as const, error: 'Booking not found' };
  }

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('id')
    .eq('id', booking.venue_id)
    .eq('owner_id', userId)
    .maybeSingle();

  if (venueError || !venue) {
    return { ok: false as const, error: 'Not authorized to manage this booking' };
  }

  return { ok: true as const, bookingId: booking.id };
}

/**
 * Delete a booking (owner must own the venue)
 */
export async function deleteOwnerBooking(bookingId: string, userId: string) {
  try {
    const access = await verifyOwnerBookingAccess(bookingId, userId);
    if (!access.ok) {
      return { success: false, error: access.error };
    }

    const supabase = await getOwnerActionSupabase();
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error deleting owner booking:', error);
    return { success: false, error: error.message || 'Failed to delete booking' };
  }
}

/**
 * Confirm a pending booking (owner must own the venue)
 */
export async function confirmOwnerBooking(bookingId: string, userId: string) {
  try {
    const access = await verifyOwnerBookingAccess(bookingId, userId);
    if (!access.ok) {
      return { success: false, error: access.error };
    }

    const supabase = await getOwnerActionSupabase();
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error confirming owner booking:', error);
    return { success: false, error: error.message || 'Failed to confirm booking' };
  }
}

/**
 * Fetch owner bookings - uses authenticated server client
 */
export async function fetchOwnerBookings(userId: string) {
  try {
    // Create authenticated Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get owner's venues first
    const { data: venues } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', userId);

    if (!venues || venues.length === 0) {
      return [];
    }

    const venueIds = venues.map(v => v.id);

    // Fetch bookings for those venues
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, venues(name, city, sport_type)')
      .in('venue_id', venueIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner bookings:', error);
      return [];
    }

    return bookings || [];
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    return [];
  }
}

/**
 * Fetch owner analytics data
 */
export async function fetchOwnerAnalytics(userId: string) {
  try {
    // Get owner's venues
    const { data: venues } = await supabaseServer
      .from('venues')
      .select('id, name, city, sport_type, total_bookings, created_at')
      .eq('owner_id', userId);

    if (!venues || venues.length === 0) {
      return {
        venues: [],
        totalBookings: 0,
        totalRevenue: 0,
        recentBookings: []
      };
    }

    const venueIds = venues.map(v => v.id);

    // Fetch bookings for analytics
    const { data: bookings } = await supabaseServer
      .from('bookings')
      .select('*, venues(name)')
      .in('venue_id', venueIds)
      .order('created_at', { ascending: false })
      .limit(10);

    const totalBookings = venues.reduce((sum, v) => sum + (v.total_bookings || 0), 0);

    return {
      venues,
      totalBookings,
      totalRevenue: 0, // Calculate if needed
      recentBookings: bookings || []
    };
  } catch (error) {
    console.error('Error fetching owner analytics:', error);
    return {
      venues: [],
      totalBookings: 0,
      totalRevenue: 0,
      recentBookings: []
    };
  }
}

// ==================== ADMIN DASHBOARD FETCHING ====================

/**
 * Fetch admin dashboard stats
 */
export async function fetchAdminDashboard() {
  try {
    const [venuesResult, bookingsResult, usersResult, revenueResult] = await Promise.all([
      supabaseServer.from('venues').select('id, status', { count: 'exact' }),
      supabaseServer.from('bookings').select('id, status', { count: 'exact' }),
      supabaseServer.from('profiles').select('id, role', { count: 'exact' }),
      supabaseServer.from('bookings').select('total_price').eq('status', 'completed')
    ]);

    const pendingVenues = venuesResult.data?.filter(v => v.status === 'pending').length || 0;
    const approvedVenues = venuesResult.data?.filter(v => v.status === 'approved').length || 0;
    const totalRevenue = revenueResult.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

    return {
      totalVenues: venuesResult.count || 0,
      pendingVenues,
      approvedVenues,
      totalBookings: bookingsResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalRevenue
    };
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return {
      totalVenues: 0,
      pendingVenues: 0,
      approvedVenues: 0,
      totalBookings: 0,
      totalUsers: 0,
      totalRevenue: 0
    };
  }
}

/**
 * Fetch all venues for admin
 */
export async function fetchAdminVenues() {
  try {
    const { data, error } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(photo_url), profiles!venues_owner_id_fkey(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin venues:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching admin venues:', error);
    return [];
  }
}

/**
 * Fetch all users for admin
 */
export async function fetchAdminUsers() {
  try {
    const { data, error } = await supabaseServer
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

/**
 * Fetch admin analytics
 */
export async function fetchAdminAnalytics() {
  try {
    const [venues, bookings, users] = await Promise.all([
      supabaseServer.from('venues').select('id, name, created_at, total_bookings'),
      supabaseServer.from('bookings').select('id, created_at, total_price, status').order('created_at', { ascending: false }).limit(100),
      supabaseServer.from('profiles').select('id, created_at, role')
    ]);

    return {
      venues: venues.data || [],
      bookings: bookings.data || [],
      users: users.data || []
    };
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return {
      venues: [],
      bookings: [],
      users: []
    };
  }
}

// ==================== LOYALTY SYSTEM ====================

export interface LoyaltyTier {
  id?: string;
  venue_id: string;
  tier_name: string;
  min_bookings: number;
  discount_percent: number;
}

/**
 * Fetch loyalty tiers for a venue
 */
export async function fetchVenueLoyaltyTiers(venueId: string): Promise<LoyaltyTier[]> {
  try {
    const { data, error } = await supabaseServer
      .from('venue_loyalty_tiers')
      .select('*')
      .eq('venue_id', venueId)
      .order('min_bookings', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error);
    return [];
  }
}

/**
 * Get user's completed booking count at a specific venue
 * and determine their applicable loyalty tier + discount
 */
export async function fetchUserLoyaltyStatus(
  venueId: string,
  playerEmail: string
): Promise<{ completedBookings: number; currentTier: LoyaltyTier | null; nextTier: LoyaltyTier | null }> {
  try {
    // Fetch confirmed + completed bookings for this user at this venue
    const { data: bookingsData, error: countError } = await supabaseServer
      .from('bookings')
      .select('status, booking_date, end_time')
      .eq('venue_id', venueId)
      .eq('player_email', playerEmail)
      .in('status', ['completed', 'confirmed']);

    if (countError) throw countError;

    // Count bookings that are effectively completed:
    // - status is 'completed' in DB, OR
    // - status is 'confirmed' AND end time has passed
    const now = new Date();
    const completedBookings = (bookingsData || []).filter((b) => {
      if (b.status === 'completed') return true;
      if (b.status === 'confirmed') {
        try {
          const bookingEndDateTime = new Date(`${b.booking_date}T${b.end_time}`);
          return bookingEndDateTime < now;
        } catch {
          return false;
        }
      }
      return false;
    }).length;

    // Fetch loyalty tiers for this venue
    const tiers = await fetchVenueLoyaltyTiers(venueId);

    if (tiers.length === 0) {
      return { completedBookings, currentTier: null, nextTier: null };
    }

    // Find the highest applicable tier (where user's bookings >= min_bookings)
    let currentTier: LoyaltyTier | null = null;
    let nextTier: LoyaltyTier | null = null;

    for (const tier of tiers) {
      if (completedBookings >= tier.min_bookings) {
        currentTier = tier;
      } else if (!nextTier) {
        nextTier = tier;
      }
    }

    return { completedBookings, currentTier, nextTier };
  } catch (error) {
    console.error('Error fetching user loyalty status:', error);
    return { completedBookings: 0, currentTier: null, nextTier: null };
  }
}/**
 * Save loyalty tiers for a venue (owner action)
 * Deletes existing tiers and inserts new ones
 */
export async function saveVenueLoyaltyTiers(
  venueId: string,
  tiers: Array<{ tier_name: string; min_bookings: number; discount_percent: number }>
) {
  try {
    const supabase = await getOwnerActionSupabase();

    // Delete existing tiers for this venue
    const { error: deleteError } = await supabase
      .from('venue_loyalty_tiers')
      .delete()
      .eq('venue_id', venueId);

    if (deleteError) throw deleteError;

    // Insert new tiers (if any)
    if (tiers.length > 0) {
      const tierInserts = tiers.map(tier => ({
        venue_id: venueId,
        tier_name: tier.tier_name,
        min_bookings: tier.min_bookings,
        discount_percent: tier.discount_percent,
      }));

      const { error: insertError } = await supabase
        .from('venue_loyalty_tiers')
        .insert(tierInserts);

      if (insertError) throw insertError;
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error saving loyalty tiers:', error);
    return { error: error.message || 'Failed to save loyalty tiers' };
  }
}

const BOOKING_CAPACITY_STATUSES = ['pending', 'confirmed'] as const;

export type VenueDayBooking = {
  start_time: string;
  end_time: string;
};

/**
 * Bookings that consume court capacity for a venue on a given date.
 */
export async function fetchVenueBookingsForDate(venueId: string, bookingDate: string) {
  try {
    const { data, error } = await supabaseServer
      .from('bookings')
      .select('start_time, end_time, status')
      .eq('venue_id', venueId)
      .eq('booking_date', bookingDate)
      .in('status', [...BOOKING_CAPACITY_STATUSES]);

    if (error) {
      return { bookings: [] as VenueDayBooking[], error: error.message };
    }

    const bookings = (data || []).map((row) => ({
      start_time: row.start_time,
      end_time: row.end_time,
    }));

    return { bookings, error: null };
  } catch (error: any) {
    console.error('Error fetching venue bookings for date:', error);
    return { bookings: [] as VenueDayBooking[], error: error.message || 'Failed to fetch bookings' };
  }
}

export async function checkCourtAvailability(
  venueId: string,
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  try {
    const { data: venue, error: venueError } = await supabaseServer
      .from('venues')
      .select('number_of_courts')
      .eq('id', venueId)
      .eq('status', 'approved')
      .maybeSingle();

    if (venueError || !venue) {
      return {
        available: false,
        availableCourts: 0,
        bookedCourts: 0,
        totalCourts: 1,
        error: 'Venue not found',
      };
    }

    const { bookings, error: bookingsError } = await fetchVenueBookingsForDate(venueId, bookingDate);
    if (bookingsError) {
      return {
        available: false,
        availableCourts: 0,
        bookedCourts: 0,
        totalCourts: venue.number_of_courts ?? 1,
        error: bookingsError,
      };
    }

    const intervals = bookings.map((b) => bookingToInterval(b.start_time, b.end_time));
    const availability = getCourtAvailability(
      venue.number_of_courts ?? 1,
      intervals,
      startTime,
      endTime
    );

    return { ...availability, error: null };
  } catch (error: any) {
    console.error('Error checking court availability:', error);
    return {
      available: false,
      availableCourts: 0,
      bookedCourts: 0,
      totalCourts: 1,
      error: error.message || 'Failed to check availability',
    };
  }
}

export type CreatePlayerBookingInput = {
  venueId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  totalPrice: number;
  playerName: string;
  playerPhone: string;
  playerEmail: string;
  notes?: string | null;
};

/**
 * Create a player booking with court-capacity validation.
 */
export async function createPlayerBooking(input: CreatePlayerBookingInput) {
  try {
    const availability = await checkCourtAvailability(
      input.venueId,
      input.bookingDate,
      input.startTime,
      input.endTime
    );

    if (availability.error) {
      return { success: false, error: availability.error, availability };
    }

    if (!availability.available) {
      return {
        success: false,
        error: 'No courts available for the selected time. Please choose a different time.',
        availability,
      };
    }

    let status: 'pending' | 'confirmed' = 'pending';
    const { data: venue } = await supabaseServer
      .from('venues')
      .select('owner_id')
      .eq('id', input.venueId)
      .maybeSingle();

    if (venue?.owner_id) {
      const supabase = await getOwnerActionSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === venue.owner_id) {
        status = 'confirmed';
      }
    }

    const { error } = await supabaseServer.from('bookings').insert({
      venue_id: input.venueId,
      booking_date: input.bookingDate,
      start_time: input.startTime,
      end_time: input.endTime,
      total_hours: input.totalHours,
      total_price: input.totalPrice,
      player_name: input.playerName,
      player_phone: input.playerPhone,
      player_email: input.playerEmail,
      notes: input.notes || null,
      status,
    });

    if (error) {
      return { success: false, error: error.message, availability };
    }

    return { success: true, error: null, availability };
  } catch (error: any) {
    console.error('Error creating player booking:', error);
    return { success: false, error: error.message || 'Failed to create booking' };
  }
}

/**
 * Fetch user bookings - uses supabaseServer (service role) to avoid auth hangs
 */
export async function fetchUserBookings(email: string) {
  try {
    if (!email) {
      return { data: [], error: 'No email provided' };
    }

    const { data, error } = await supabaseServer
      .from('bookings')
      .select(`
        *,
        venues (
          name,
          slug,
          venue_photos (
            photo_url,
            display_order
          )
        )
      `)
      .eq('player_email', email)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching user bookings:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Fetch owner's venues - uses supabaseServer to avoid client-side auth hangs
 */
export async function fetchOwnerVenuesServer(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('venues')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'approved')
      .order('name');

    if (error) {
      console.error('Error fetching owner venues:', error);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching owner venues:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Fetch special offers for owner's venues - uses supabaseServer to avoid client-side auth hangs
 */
export async function fetchOwnerOffersServer(userId: string) {
  try {
    // First get venue IDs
    const { data: venuesData, error: venuesError } = await supabaseServer
      .from('venues')
      .select('id')
      .eq('owner_id', userId);

    if (venuesError) {
      console.error('Error fetching owner venue ids:', venuesError);
      return { data: [], error: venuesError.message };
    }

    if (!venuesData || venuesData.length === 0) {
      return { data: [], error: null };
    }

    const venueIds = venuesData.map(v => v.id);

    const { data, error } = await supabaseServer
      .from('special_offers')
      .select('*')
      .in('venue_id', venueIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner offers:', error);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching owner offers:', error);
    return { data: [], error: error.message };
  }
}

async function verifyOwnerVenueAccess(venueId: string, userId: string) {
  const supabase = await getOwnerActionSupabase();
  const { data: venue, error } = await supabase
    .from('venues')
    .select('id')
    .eq('id', venueId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (error || !venue) {
    return { ok: false as const, error: 'Not authorized to manage this venue' };
  }

  return { ok: true as const };
}

async function verifyOwnerOfferAccess(offerId: string, userId: string) {
  const supabase = await getOwnerActionSupabase();
  const { data: offer, error } = await supabase
    .from('special_offers')
    .select('*')
    .eq('id', offerId)
    .maybeSingle();

  if (error || !offer) {
    return { ok: false as const, error: 'Offer not found' };
  }

  const venueAccess = await verifyOwnerVenueAccess(offer.venue_id, userId);
  if (!venueAccess.ok) {
    return { ok: false as const, error: venueAccess.error };
  }

  return { ok: true as const, offer };
}

export async function deleteOwnerOffer(offerId: string, userId: string) {
  try {
    const access = await verifyOwnerOfferAccess(offerId, userId);
    if (!access.ok) {
      return { success: false, error: access.error };
    }

    const supabase = await getOwnerActionSupabase();
    const { error } = await supabase
      .from('special_offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error deleting owner offer:', error);
    return { success: false, error: error.message || 'Failed to delete offer' };
  }
}

export async function toggleOwnerOfferStatus(offerId: string, userId: string) {
  try {
    const access = await verifyOwnerOfferAccess(offerId, userId);
    if (!access.ok) {
      return { success: false, offer: null, error: access.error };
    }

    const supabase = await getOwnerActionSupabase();
    const newActive = !access.offer.is_active;

    const { error: updateError } = await supabase
      .from('special_offers')
      .update({ is_active: newActive })
      .eq('id', offerId);

    if (updateError) {
      return { success: false, offer: null, error: updateError.message };
    }

    const { data, error: fetchError } = await supabase
      .from('special_offers')
      .select('*')
      .eq('id', offerId)
      .maybeSingle();

    if (fetchError || !data) {
      return {
        success: true,
        offer: { ...access.offer, is_active: newActive },
        error: null,
      };
    }

    return { success: true, offer: data, error: null };
  } catch (error: any) {
    console.error('Error toggling owner offer:', error);
    return { success: false, offer: null, error: error.message || 'Failed to update offer status' };
  }
}

export type OwnerOfferInput = {
  venue_id: string;
  offer_name: string;
  description: string | null;
  original_price: number;
  offer_price: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
};

export async function saveOwnerOffer(
  userId: string,
  offerId: string | null,
  input: OwnerOfferInput
) {
  try {
    const venueAccess = await verifyOwnerVenueAccess(input.venue_id, userId);
    if (!venueAccess.ok) {
      return { success: false, offer: null, error: venueAccess.error };
    }

    if (offerId) {
      const access = await verifyOwnerOfferAccess(offerId, userId);
      if (!access.ok) {
        return { success: false, offer: null, error: access.error };
      }
    }

    const discount_percentage =
      input.original_price > 0
        ? ((input.original_price - input.offer_price) / input.original_price) * 100
        : 0;

    const payload = {
      ...input,
      discount_percentage,
    };

    const supabase = await getOwnerActionSupabase();

    if (offerId) {
      const { error: updateError } = await supabase
        .from('special_offers')
        .update(payload)
        .eq('id', offerId);

      if (updateError) {
        return { success: false, offer: null, error: updateError.message };
      }

      const { data, error: fetchError } = await supabase
        .from('special_offers')
        .select('*')
        .eq('id', offerId)
        .maybeSingle();

      if (fetchError || !data) {
        return { success: false, offer: null, error: fetchError?.message || 'Failed to load updated offer' };
      }

      return { success: true, offer: data, error: null };
    }

    const { data, error } = await supabase
      .from('special_offers')
      .insert([payload])
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return { success: false, offer: null, error: error?.message || 'Failed to create offer' };
    }

    return { success: true, offer: data, error: null };
  } catch (error: any) {
    console.error('Error saving owner offer:', error);
    return { success: false, offer: null, error: error.message || 'Failed to save offer' };
  }
}

/**
 * Fetch owner profile + venue stats
 */
export async function fetchPlayerProfileServer(userId: string) {
  try {
    const supabase = await getOwnerActionSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { profile: null, bookingDetails: null, error: 'Not authenticated' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, phone, whatsapp_number')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { profile: null, bookingDetails: null, error: error.message };
    }

    const bookingDetails = resolvePlayerBookingDetails(profile, user);

    return { profile, bookingDetails, error: null };
  } catch (error: any) {
    console.error('Error fetching player profile:', error);
    return {
      profile: null,
      bookingDetails: null,
      error: error.message || 'Failed to fetch profile',
    };
  }
}

export async function fetchOwnerProfileServer(userId: string) {
  try {
    const [profileResult, venuesResult] = await Promise.all([
      supabaseServer.from('profiles').select('*').eq('id', userId).single(),
      supabaseServer.from('venues').select('id, status').eq('owner_id', userId),
    ]);

    return {
      profile: profileResult.data,
      venues: venuesResult.data || [],
      error: profileResult.error?.message || venuesResult.error?.message || null,
    };
  } catch (error: any) {
    console.error('Error fetching owner profile:', error);
    return { profile: null, venues: [], error: error.message };
  }
}

/**
 * Fetch owner's venues with subdomain info (for settings page)
 */
export async function fetchOwnerVenuesForSettings(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('venues')
      .select('id, name, slug, subdomain')
      .eq('owner_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching owner venues for settings:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Fetch owner bookings via server
 */
export async function fetchOwnerBookingsServer(userId: string) {
  try {
    const { data: venues } = await supabaseServer
      .from('venues')
      .select('id')
      .eq('owner_id', userId);

    if (!venues || venues.length === 0) {
      return { data: [], error: null };
    }

    const venueIds = venues.map(v => v.id);

    const { data, error } = await supabaseServer
      .from('bookings')
      .select('*, venues(name, city, sport_type)')
      .in('venue_id', venueIds)
      .order('booking_date', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching owner bookings:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Fetch owner venues with photos (for venues management page refresh)
 */
export async function fetchOwnerVenuesWithPhotos(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching owner venues with photos:', error);
    return { data: [], error: error.message };
  }
}
