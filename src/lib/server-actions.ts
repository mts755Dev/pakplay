// Server-side data fetching utilities for SSR
// These are NOT hooks - they're server-only functions
"use server";

import { getServerUser } from './auth-server';
import {
  isBookingEffectivelyCompleted,
  isBookingEndTimePassed,
  normalizeBookingDateKey,
} from './booking-status';
import { format, startOfMonth } from 'date-fns';
import { supabaseServer } from './supabase-server';
import { getOwnerActionSupabase } from './supabase-owner';
import { bookingToInterval, getCourtAvailability } from './court-availability';
import { resolvePlayerBookingDetails } from './player-profile';
import { verifyTurnstileToken } from './turnstile';
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
    .select('id, venue_id, status, booking_date, start_time, end_time')
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

  return {
    ok: true as const,
    bookingId: booking.id,
    status: booking.status,
    booking_date: booking.booking_date,
    start_time: booking.start_time,
    end_time: booking.end_time,
  };
}

/**
 * Mark confirmed bookings as completed once their end time has passed.
 */
export async function autoCompleteOwnerBookings(userId: string) {
  try {
    const { data: venues } = await supabaseServer
      .from('venues')
      .select('id')
      .eq('owner_id', userId);

    if (!venues?.length) {
      return { completed: 0, error: null };
    }

    const venueIds = venues.map((venue) => venue.id);
    const { data: bookings, error } = await supabaseServer
      .from('bookings')
      .select('id, booking_date, end_time, status')
      .in('venue_id', venueIds)
      .eq('status', 'confirmed');

    if (error) {
      return { completed: 0, error: error.message };
    }

    const idsToComplete = (bookings || [])
      .filter((booking) => isBookingEndTimePassed(booking.booking_date, booking.end_time))
      .map((booking) => booking.id);

    if (idsToComplete.length === 0) {
      return { completed: 0, error: null };
    }

    const { error: updateError } = await supabaseServer
      .from('bookings')
      .update({ status: 'completed' })
      .in('id', idsToComplete);

    if (updateError) {
      return { completed: 0, error: updateError.message };
    }

    return { completed: idsToComplete.length, error: null };
  } catch (error: any) {
    console.error('Error auto-completing owner bookings:', error);
    return { completed: 0, error: error.message || 'Failed to auto-complete bookings' };
  }
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

    if (isBookingEffectivelyCompleted(access)) {
      return {
        success: false,
        error: 'Completed bookings cannot be deleted.',
      };
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
    await autoCompleteOwnerBookings(userId);

    const { data: venues } = await supabaseServer
      .from('venues')
      .select('id, name, city, sport_type, total_bookings, created_at, status')
      .eq('owner_id', userId);

    if (!venues || venues.length === 0) {
      return {
        venues: [],
        totalBookings: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        monthLabel: format(new Date(), 'MMMM yyyy'),
        recentBookings: [],
      };
    }

    const venueIds = venues.map((venue) => venue.id);
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    const [{ data: bookings }, { data: completedBookings }] = await Promise.all([
      supabaseServer
        .from('bookings')
        .select('*, venues(name)')
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseServer
        .from('bookings')
        .select('venue_id, total_price, booking_date')
        .in('venue_id', venueIds)
        .eq('status', 'completed'),
    ]);

    const venueRevenue = new Map<string, number>();
    (completedBookings || []).forEach((booking) => {
      const current = venueRevenue.get(booking.venue_id) || 0;
      venueRevenue.set(booking.venue_id, current + (booking.total_price || 0));
    });

    const totalRevenue = (completedBookings || []).reduce(
      (sum, booking) => sum + (booking.total_price || 0),
      0
    );

    const revenueThisMonth = (completedBookings || [])
      .filter((booking) => normalizeBookingDateKey(booking.booking_date) >= monthStart)
      .reduce((sum, booking) => sum + (booking.total_price || 0), 0);

    const totalBookings = venues.reduce((sum, venue) => sum + (venue.total_bookings || 0), 0);

    return {
      venues: venues.map((venue) => ({
        ...venue,
        revenue: venueRevenue.get(venue.id) || 0,
      })),
      totalBookings,
      totalRevenue,
      revenueThisMonth,
      monthLabel: format(new Date(), 'MMMM yyyy'),
      recentBookings: bookings || [],
    };
  } catch (error) {
    console.error('Error fetching owner analytics:', error);
    return {
      venues: [],
      totalBookings: 0,
      totalRevenue: 0,
      revenueThisMonth: 0,
      monthLabel: format(new Date(), 'MMMM yyyy'),
      recentBookings: [],
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
  discountType?: 'offer' | 'loyalty' | null;
  discountLabel?: string | null;
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
      const user = await getServerUser();
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
      discount_type: input.discountType || null,
      discount_label: input.discountLabel || null,
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

// ==================== VENUE REVIEWS ====================

export async function fetchVenueReviews(venueId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('venue_reviews')
      .select('*')
      .eq('venue_id', venueId)
      .order('date', { ascending: false });

    if (error) {
      return { reviews: [] as VenueReview[], error: error.message };
    }

    return { reviews: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching venue reviews:', error);
    return { reviews: [] as VenueReview[], error: error.message || 'Failed to fetch reviews' };
  }
}

export async function createReviewPhotoUploadUrl(
  venueId: string,
  fileName: string,
  index = 0
) {
  try {
    const { data: venue, error: venueError } = await supabaseServer
      .from('venues')
      .select('id')
      .eq('id', venueId)
      .eq('status', 'approved')
      .maybeSingle();

    if (venueError || !venue) {
      return { signedUrl: null, publicUrl: null, error: 'Venue not found' };
    }

    const fileExt = fileName.split('.').pop() || 'jpg';
    const storagePath = `review-photos/${venueId}/${Date.now()}_${index}.${fileExt}`;

    const { data, error } = await supabaseServer.storage
      .from('venue-photos')
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      return { signedUrl: null, publicUrl: null, error: error?.message || 'Failed to create upload URL' };
    }

    const { data: { publicUrl } } = supabaseServer.storage
      .from('venue-photos')
      .getPublicUrl(storagePath);

    return { signedUrl: data.signedUrl, publicUrl, error: null };
  } catch (error: any) {
    console.error('Error creating review photo upload URL:', error);
    return { signedUrl: null, publicUrl: null, error: error.message || 'Failed to create upload URL' };
  }
}

export async function submitVenueReview(input: {
  venueId: string;
  customerName: string;
  rating: number;
  reviewText: string;
  photoUrls?: string[];
  captchaToken: string;
}) {
  try {
    const captcha = await verifyTurnstileToken(input.captchaToken);
    if (!captcha.success) {
      return { success: false, error: captcha.error || 'Captcha verification failed' };
    }

    const { data: venue, error: venueError } = await supabaseServer
      .from('venues')
      .select('id')
      .eq('id', input.venueId)
      .eq('status', 'approved')
      .maybeSingle();

    if (venueError || !venue) {
      return { success: false, error: 'Venue not found' };
    }

    const { error } = await supabaseServer.from('venue_reviews').insert({
      venue_id: input.venueId,
      customer_name: input.customerName.trim(),
      rating: input.rating,
      review_text: input.reviewText.trim(),
      photo_urls: input.photoUrls && input.photoUrls.length > 0 ? input.photoUrls : null,
      date: new Date().toISOString().split('T')[0],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error submitting venue review:', error);
    return { success: false, error: error.message || 'Failed to submit review' };
  }
}

// ==================== CONTACT & AUTH ====================

function createAuthActionClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
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
            // Server actions may not set cookies in some contexts
          }
        },
      },
    }
  );
}

export async function submitContactForm(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  try {
    const { error } = await supabaseServer.from('contact_submissions').insert({
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: 'new',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error submitting contact form:', error);
    return { success: false, error: error.message || 'Failed to send message' };
  }
}

export async function signUpUser(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'player' | 'venue_owner';
  captchaToken: string;
}) {
  try {
    const captcha = await verifyTurnstileToken(input.captchaToken);
    if (!captcha.success) {
      return { success: false, error: captcha.error || 'Captcha verification failed', userId: null };
    }

    const supabase = createAuthActionClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          full_name: input.fullName.trim(),
          phone: input.phone.trim(),
          role: input.role,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message, userId: null };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account', userId: null };
    }

    const { error: profileError } = await supabaseServer.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        whatsapp_number: input.phone.trim(),
        role: input.role,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.error('Profile upsert error:', profileError);
    }

    return {
      success: true,
      error: null,
      userId: data.user.id,
      role: input.role,
      email: input.email.trim(),
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
    };
  } catch (error: any) {
    console.error('Error signing up user:', error);
    return { success: false, error: error.message || 'Failed to create account', userId: null };
  }
}

export async function updateUserPassword(newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  try {
    const supabase = createAuthActionClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'You must be signed in to update your password' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return { success: false, error: error.message || 'Failed to update password' };
  }
}

export async function updateUserProfile(input: {
  fullName?: string;
  phone?: string;
  whatsappNumber?: string;
}) {
  try {
    const supabase = createAuthActionClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'You must be signed in' };
    }

    const updates: {
      full_name?: string;
      phone?: string;
      whatsapp_number?: string;
    } = {};

    if (input.fullName !== undefined) updates.full_name = input.fullName.trim();
    if (input.phone !== undefined) updates.phone = input.phone.trim();
    if (input.whatsappNumber !== undefined) updates.whatsapp_number = input.whatsappNumber.trim();

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
}

export async function updateOwnerVenueSubdomain(
  userId: string,
  venueId: string,
  subdomain: string | null
) {
  const normalizedSubdomain = subdomain?.trim().toLowerCase() || null;

  if (normalizedSubdomain) {
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(normalizedSubdomain)) {
      return { success: false, error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' };
    }
    if (normalizedSubdomain.length < 3) {
      return { success: false, error: 'Subdomain must be at least 3 characters long' };
    }
  }

  try {
    const venueAccess = await verifyOwnerVenueAccess(venueId, userId);
    if (!venueAccess.ok) {
      return { success: false, error: venueAccess.error };
    }

    if (normalizedSubdomain) {
      const { data: existingVenue } = await supabaseServer
        .from('venues')
        .select('id')
        .eq('subdomain', normalizedSubdomain)
        .neq('id', venueId)
        .maybeSingle();

      if (existingVenue) {
        return { success: false, error: 'This subdomain is already taken' };
      }
    }

    const { error } = await supabaseServer
      .from('venues')
      .update({ subdomain: normalizedSubdomain })
      .eq('id', venueId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating venue subdomain:', error);
    return { success: false, error: error.message || 'Failed to update subdomain' };
  }
}

// ==================== SHARED SESSION HELPERS ====================

type SessionResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

async function requireAuthSession(): Promise<SessionResult> {
  const supabase = createAuthActionClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, error: 'Not authenticated' };
  return { ok: true, userId: user.id };
}

async function requireAdminSession(): Promise<SessionResult> {
  const auth = await requireAuthSession();
  if (!auth.ok) return auth;

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', auth.userId)
    .maybeSingle();

  if (profile?.role !== 'admin') return { ok: false, error: 'Access denied' };
  return auth;
}

// ==================== AUTH ACTIONS ====================

export async function signInUser(input: {
  email: string;
  password: string;
  mode: 'user' | 'admin';
}) {
  try {
    const supabase = createAuthActionClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim(),
      password: input.password,
    });

    if (error) {
      return { success: false, error: error.message, profile: null, userId: null, email: null };
    }

    if (!data.user) {
      return { success: false, error: 'Sign in failed', profile: null, userId: null, email: null };
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role, full_name, phone, whatsapp_number')
      .eq('id', data.user.id)
      .maybeSingle();

    if (input.mode === 'admin' && profile?.role !== 'admin') {
      await supabase.auth.signOut();
      return { success: false, error: 'Access denied. Admin credentials required.', profile: null, userId: null, email: null };
    }

    if (input.mode === 'user' && profile?.role === 'admin') {
      await supabase.auth.signOut();
      return { success: false, error: 'Admins must sign in at /admin', profile: null, userId: null, email: null };
    }

    return {
      success: true,
      error: null,
      userId: data.user.id,
      email: data.user.email || input.email.trim(),
      profile,
    };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { success: false, error: error.message || 'Sign in failed', profile: null, userId: null, email: null };
  }
}

export async function signOutUser() {
  try {
    const supabase = createAuthActionClient();
    await supabase.auth.signOut();
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message || 'Sign out failed' };
  }
}

export async function getAdminSession() {
  try {
    const supabase = createAuthActionClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, isAdmin: false, user: null, error: 'Not authenticated' };
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role, full_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return { success: false, isAdmin: false, user: null, error: 'Access denied' };
    }

    return {
      success: true,
      isAdmin: true,
      user: { id: user.id, email: user.email },
      error: null,
    };
  } catch (error: any) {
    console.error('Error getting admin session:', error);
    return { success: false, isAdmin: false, user: null, error: error.message || 'Session check failed' };
  }
}

export async function fetchUserProfileById(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('profiles')
      .select('role, full_name, phone, whatsapp_number')
      .eq('id', userId)
      .maybeSingle();

    if (error) return { profile: null, error: error.message };
    return { profile: data, error: null };
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return { profile: null, error: error.message || 'Failed to fetch profile' };
  }
}

export async function deleteUserAccount() {
  try {
    const auth = await requireAuthSession();
    if (!auth.ok) return { success: false, error: auth.error };

    const supabase = createAuthActionClient();
    const { error } = await supabase.rpc('delete_user_account');

    if (error) return { success: false, error: error.message };
    await supabase.auth.signOut();
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    return { success: false, error: error.message || 'Failed to delete account' };
  }
}

export async function updateUserEmail(newEmail: string) {
  try {
    const email = newEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const supabase = createAuthActionClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'You must be signed in' };
    }

    const { error } = await supabase.auth.updateUser({ email });
    if (error) return { success: false, error: error.message };

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating email:', error);
    return { success: false, error: error.message || 'Failed to update email' };
  }
}

// ==================== VENUE FETCH (PUBLIC) ====================

export async function fetchVenueBySubdomain(subdomain: string): Promise<VenueWithData | null> {
  try {
    const { data: venue, error } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('subdomain', subdomain)
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
        .maybeSingle(),
    ]);

    return {
      ...venue,
      reviews: reviewsResult.data || [],
      active_offer: offerResult.data || null,
      calculated_rating:
        reviewsResult.data && reviewsResult.data.length > 0
          ? reviewsResult.data.reduce((acc, r) => acc + r.rating, 0) / reviewsResult.data.length
          : 0,
      review_count: reviewsResult.data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching venue by subdomain:', error);
    return null;
  }
}

// ==================== USER BOOKING ACTIONS ====================

export async function cancelUserBooking(bookingId: string, userEmail: string) {
  try {
    const auth = await requireAuthSession();
    if (!auth.ok) return { success: false, error: auth.error };

    const { data: booking, error: fetchError } = await supabaseServer
      .from('bookings')
      .select('id, player_email')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError || !booking) return { success: false, error: 'Booking not found' };
    if (booking.player_email?.toLowerCase() !== userEmail.trim().toLowerCase()) {
      return { success: false, error: 'Not authorized to cancel this booking' };
    }

    const { error } = await supabaseServer
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return { success: false, error: error.message || 'Failed to cancel booking' };
  }
}

export async function cleanupUserBookings(
  userEmail: string,
  expiredIds: string[],
  completeIds: string[]
) {
  try {
    if (expiredIds.length === 0 && completeIds.length === 0) {
      return { success: true, error: null };
    }

    const { data: bookings } = await supabaseServer
      .from('bookings')
      .select('id, player_email')
      .in('id', [...expiredIds, ...completeIds]);

    const ownedIds = new Set(
      (bookings || [])
        .filter((b) => b.player_email?.toLowerCase() === userEmail.trim().toLowerCase())
        .map((b) => b.id)
    );

    const safeExpired = expiredIds.filter((id) => ownedIds.has(id));
    const safeComplete = completeIds.filter((id) => ownedIds.has(id));

    if (safeExpired.length > 0) {
      await supabaseServer.from('bookings').delete().in('id', safeExpired);
    }

    if (safeComplete.length > 0) {
      await supabaseServer
        .from('bookings')
        .update({ status: 'completed' })
        .in('id', safeComplete);
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error cleaning up user bookings:', error);
    return { success: false, error: error.message || 'Failed to clean up bookings' };
  }
}

// ==================== OWNER VENUE ACTIONS ====================

export async function fetchOwnerVenuesList(userId: string) {
  try {
    const auth = await requireAuthSession();
    if (!auth.ok || auth.userId !== userId) {
      return { data: [], error: auth.ok ? 'Not authorized' : auth.error };
    }

    const { data, error } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching owner venues list:', error);
    return { data: [], error: error.message || 'Failed to load venues' };
  }
}

export async function deleteOwnerVenue(userId: string, venueId: string) {
  try {
    const venueAccess = await verifyOwnerVenueAccess(venueId, userId);
    if (!venueAccess.ok) return { success: false, error: venueAccess.error };

    const { error } = await supabaseServer.from('venues').delete().eq('id', venueId);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error deleting owner venue:', error);
    return { success: false, error: error.message || 'Failed to delete venue' };
  }
}

export async function reportOwnerReview(input: {
  userId: string;
  reviewId: string;
  venueId: string;
  reason: string;
}) {
  try {
    const venueAccess = await verifyOwnerVenueAccess(input.venueId, input.userId);
    if (!venueAccess.ok) return { success: false, error: venueAccess.error };

    const { error } = await supabaseServer.from('review_reports').insert({
      review_id: input.reviewId,
      venue_id: input.venueId,
      reporter_id: input.userId,
      reason: input.reason.trim(),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error reporting review:', error);
    return { success: false, error: error.message || 'Failed to submit report' };
  }
}

export async function createOnboardingLogoUploadUrl(userId: string, fileName: string) {
  try {
    const auth = await requireAuthSession();
    if (!auth.ok || auth.userId !== userId) {
      return { signedUrl: null, publicUrl: null, error: 'Not authorized' };
    }

    const fileExt = fileName.split('.').pop() || 'png';
    const storagePath = `${userId}/onboarding/logo_${Date.now()}.${fileExt}`;

    const { data, error } = await supabaseServer.storage
      .from('venue-logos')
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      return { signedUrl: null, publicUrl: null, error: error?.message || 'Failed to create upload URL' };
    }

    const { data: { publicUrl } } = supabaseServer.storage.from('venue-logos').getPublicUrl(storagePath);
    return { signedUrl: data.signedUrl, publicUrl, error: null };
  } catch (error: any) {
    return { signedUrl: null, publicUrl: null, error: error.message || 'Failed to create upload URL' };
  }
}

export async function createOnboardingPhotoUploadUrl(
  userId: string,
  fileName: string,
  index = 0
) {
  try {
    const auth = await requireAuthSession();
    if (!auth.ok || auth.userId !== userId) {
      return { signedUrl: null, publicUrl: null, error: 'Not authorized' };
    }

    const fileExt = fileName.split('.').pop() || 'jpg';
    const storagePath = `${userId}/onboarding/${Date.now()}_${index}.${fileExt}`;

    const { data, error } = await supabaseServer.storage
      .from('venue-photos')
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      return { signedUrl: null, publicUrl: null, error: error?.message || 'Failed to create upload URL' };
    }

    const { data: { publicUrl } } = supabaseServer.storage.from('venue-photos').getPublicUrl(storagePath);
    return { signedUrl: data.signedUrl, publicUrl, error: null };
  } catch (error: any) {
    return { signedUrl: null, publicUrl: null, error: error.message || 'Failed to create upload URL' };
  }
}

export async function createOwnerVenueOnboarding(input: {
  userId: string;
  venueName: string;
  sport: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel';
  province?: string | null;
  city: string;
  area?: string | null;
  subArea?: string | null;
  address: string;
  description: string;
  amenities?: string[] | null;
  pricePerHour: number;
  numberOfCourts: number;
  openingTime?: string | null;
  closingTime?: string | null;
  is24_7: boolean;
  phone: string;
  logoUrl?: string | null;
  tagline?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  googleMapsUrl?: string | null;
  photoUrls: string[];
  pricingRules: Array<{
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    price: string;
  }>;
}) {
  try {
    const auth = await requireAuthSession();
    if (!auth.ok || auth.userId !== input.userId) {
      return { success: false, error: 'Not authorized', venueId: null };
    }

    let slug = input.venueName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const { data: slugData } = await supabaseServer.rpc('generate_venue_slug', {
      venue_name: input.venueName,
    });
    if (slugData) slug = slugData;

    const { data: venue, error: venueError } = await supabaseServer
      .from('venues')
      .insert({
        owner_id: input.userId,
        name: input.venueName,
        slug,
        sport_type: input.sport,
        province: input.province || null,
        city: input.city,
        area: input.area || null,
        sub_area: input.subArea || null,
        address: input.address,
        description: input.description,
        amenities: input.amenities && input.amenities.length > 0 ? input.amenities : null,
        price_per_hour: input.pricePerHour,
        number_of_courts: input.numberOfCourts,
        opening_time: input.is24_7 ? null : input.openingTime || null,
        closing_time: input.is24_7 ? null : input.closingTime || null,
        is_24_7: input.is24_7,
        whatsapp_number: input.phone,
        status: 'pending',
        logo_url: input.logoUrl || null,
        tagline: input.tagline || null,
        facebook_url: input.facebookUrl || null,
        instagram_url: input.instagramUrl || null,
        google_maps_url: input.googleMapsUrl || null,
      })
      .select()
      .single();

    if (venueError || !venue) {
      return { success: false, error: venueError?.message || 'Failed to create venue', venueId: null };
    }

    if (input.photoUrls.length > 0) {
      const photoInserts = input.photoUrls.map((url, index) => ({
        venue_id: venue.id,
        photo_url: url,
        is_primary: index === 0,
        display_order: index,
      }));
      await supabaseServer.from('venue_photos').insert(photoInserts);
    }

    if (input.pricingRules.length > 0) {
      const pricingInserts: Array<{
        venue_id: string;
        day_of_week: number | null;
        start_time: string | null;
        end_time: string | null;
        price_per_hour: number;
        priority: number;
      }> = [];

      input.pricingRules.forEach((rule, index) => {
        if (rule.daysOfWeek.length === 0) {
          pricingInserts.push({
            venue_id: venue.id,
            day_of_week: null,
            start_time: rule.startTime || null,
            end_time: rule.endTime || null,
            price_per_hour: parseFloat(rule.price),
            priority: index,
          });
        } else {
          rule.daysOfWeek.forEach((day) => {
            pricingInserts.push({
              venue_id: venue.id,
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
        await supabaseServer.from('venue_pricing_rules').insert(pricingInserts as never);
      }
    }

    return { success: true, error: null, venueId: venue.id };
  } catch (error: any) {
    console.error('Error creating owner venue:', error);
    return { success: false, error: error.message || 'Failed to submit venue', venueId: null };
  }
}

// ==================== ADMIN ACTIONS ====================

export async function updateAdminVenueStatus(
  venueId: string,
  status: 'approved' | 'pending' | 'rejected' | 'inactive'
) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { success: false, error: admin.error };

    const { error } = await supabaseServer
      .from('venues')
      .update({ status })
      .eq('id', venueId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update venue status' };
  }
}

export async function setAdminVenueFeatured(venueId: string, featured: boolean) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { success: false, error: admin.error };

    const { error } = await supabaseServer
      .from('venues')
      .update({ featured })
      .eq('id', venueId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update featured status' };
  }
}

export async function fetchAdminPendingVenues() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: [], error: admin.error };

    const { data: venuesData, error } = await supabaseServer
      .from('venues')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    if (!venuesData || venuesData.length === 0) return { data: [], error: null };

    const venueIds = venuesData.map((v) => v.id);
    const ownerIds = venuesData.map((v) => v.owner_id).filter((id): id is string => id !== null);

    const [profilesResult, photosResult] = await Promise.all([
      ownerIds.length > 0
        ? supabaseServer.from('profiles').select('id, full_name, phone, whatsapp_number').in('id', ownerIds)
        : Promise.resolve({ data: [], error: null }),
      supabaseServer
        .from('venue_photos')
        .select('*')
        .in('venue_id', venueIds)
        .order('display_order', { ascending: true }),
    ]);

    const profilesMap = new Map((profilesResult.data || []).map((p) => [p.id, p]));
    const photosMap = new Map<string, VenuePhoto[]>();
    (photosResult.data || []).forEach((photo) => {
      if (!photosMap.has(photo.venue_id)) photosMap.set(photo.venue_id, []);
      photosMap.get(photo.venue_id)!.push(photo);
    });

    const data = venuesData.map((venue) => ({
      ...venue,
      profiles: venue.owner_id ? profilesMap.get(venue.owner_id) : null,
      venue_photos: photosMap.get(venue.id) || [],
    }));

    return { data, error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to load pending venues' };
  }
}

export async function fetchAdminVenueDetail(venueId: string) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: null, error: admin.error };

    const { data: venueData, error } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(*), venue_pricing_rules(*)')
      .eq('id', venueId)
      .single();

    if (error || !venueData) return { data: null, error: error?.message || 'Venue not found' };

    let profileData = null;
    if (venueData.owner_id) {
      const { data } = await supabaseServer
        .from('profiles')
        .select('full_name, phone, whatsapp_number')
        .eq('id', venueData.owner_id)
        .maybeSingle();
      profileData = data;
    }

    return { data: { ...venueData, profiles: profileData }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to load venue details' };
  }
}

export async function fetchAdminLocationStats() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: [], error: admin.error };

    const { data, error } = await supabaseServer
      .from('venues')
      .select('province')
      .eq('status', 'approved');

    if (error) return { data: [], error: error.message };

    const provinceCounts: Record<string, number> = {};
    (data || []).forEach((v) => {
      if (v.province) provinceCounts[v.province] = (provinceCounts[v.province] || 0) + 1;
    });

    const locationData = Object.entries(provinceCounts)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { data: locationData, error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to load location stats' };
  }
}

export async function fetchAdminVenueStatusCounts() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { total: 0, approved: 0, pending: 0, rejected: 0, error: admin.error };

    const [totalRes, approvedRes, pendingRes, rejectedRes] = await Promise.all([
      supabaseServer.from('venues').select('id', { count: 'exact', head: true }),
      supabaseServer.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabaseServer.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseServer.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);

    return {
      total: totalRes.count || 0,
      approved: approvedRes.count || 0,
      pending: pendingRes.count || 0,
      rejected: rejectedRes.count || 0,
      error: null,
    };
  } catch (error: any) {
    return { total: 0, approved: 0, pending: 0, rejected: 0, error: error.message };
  }
}

export async function fetchAdminVenuesPaginated(params: {
  offset: number;
  limit: number;
  searchQuery?: string;
  statusFilter?: string;
  provinceFilter?: string;
  cityFilter?: string;
  sportFilter?: string;
}) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: [], count: 0, error: admin.error };

    let query = supabaseServer
      .from('venues')
      .select(
        'id, name, slug, city, province, sport_type, status, featured, owner_id, created_at',
        { count: 'exact' }
      );

    if (params.searchQuery) {
      query = query.or(
        `name.ilike.%${params.searchQuery}%,city.ilike.%${params.searchQuery}%`
      );
    }
    if (params.statusFilter && params.statusFilter !== 'all') {
      query = query.eq('status', params.statusFilter as 'approved' | 'pending' | 'rejected');
    }
    if (params.provinceFilter) query = query.eq('province', params.provinceFilter);
    if (params.cityFilter) query = query.eq('city', params.cityFilter);
    if (params.sportFilter && params.sportFilter !== 'all') {
      query = query.eq('sport_type', params.sportFilter as 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel');
    }

    const { data: venuesData, error, count } = await query
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (error) return { data: [], count: 0, error: error.message };
    if (!venuesData || venuesData.length === 0) return { data: [], count: count || 0, error: null };

    const venueIds = venuesData.map((v) => v.id);
    const ownerIds = [...new Set(venuesData.map((v) => v.owner_id).filter((id): id is string => id !== null))];

    const [profilesResult, photosResult] = await Promise.all([
      ownerIds.length > 0
        ? supabaseServer.from('profiles').select('id, full_name, phone').in('id', ownerIds)
        : Promise.resolve({ data: [], error: null }),
      supabaseServer
        .from('venue_photos')
        .select('id, venue_id, photo_url, display_order')
        .in('venue_id', venueIds)
        .order('display_order', { ascending: true }),
    ]);

    const profilesMap = new Map((profilesResult.data || []).map((p) => [p.id, p]));
    const photosMap = new Map<string, Array<{ id: string; venue_id: string; photo_url: string; display_order: number }>>();
    (photosResult.data || []).forEach((photo) => {
      if (!photosMap.has(photo.venue_id)) photosMap.set(photo.venue_id, []);
      const photos = photosMap.get(photo.venue_id)!;
      if (photos.length < 4) photos.push(photo);
    });

    const data = venuesData.map((venue) => ({
      ...venue,
      profiles: venue.owner_id ? profilesMap.get(venue.owner_id) : null,
      venue_photos: photosMap.get(venue.id) || [],
    }));

    return { data, count: count || 0, error: null };
  } catch (error: any) {
    return { data: [], count: 0, error: error.message || 'Failed to load venues' };
  }
}

export async function fetchAdminContacts() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: [], error: admin.error };

    const { data, error } = await supabaseServer
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to load contacts' };
  }
}

export async function updateAdminContactSubmission(
  contactId: string,
  status: 'new' | 'in_progress' | 'resolved' | 'archived',
  adminNotes: string
) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { success: false, error: admin.error };

    const { error } = await supabaseServer
      .from('contact_submissions')
      .update({ status, admin_notes: adminNotes })
      .eq('id', contactId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update contact' };
  }
}

export async function fetchAdminReviewReports(filterStatus: string) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: [], error: admin.error };

    let query = supabaseServer
      .from('review_reports')
      .select(`
        *,
        venue:venues(name, slug),
        review:venue_reviews(customer_name, review_text, rating, photo_urls),
        reporter:profiles!review_reports_reporter_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus as 'approved' | 'pending' | 'rejected');
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to fetch reports' };
  }
}

export async function resolveAdminReviewReport(
  reportId: string,
  action: 'approved' | 'rejected',
  reviewId: string
) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { success: false, error: admin.error };

    const { error: updateError } = await supabaseServer
      .from('review_reports')
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.userId,
      })
      .eq('id', reportId);

    if (updateError) return { success: false, error: updateError.message };

    if (action === 'approved') {
      const { error: deleteError } = await supabaseServer
        .from('venue_reviews')
        .delete()
        .eq('id', reviewId);

      if (deleteError) return { success: false, error: deleteError.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to process report' };
  }
}

export async function fetchAdminNotifications() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: [], error: admin.error };

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [newUsersResult, pendingVenuesResult] = await Promise.all([
      supabaseServer
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('role', 'venue_owner')
        .gte('created_at', last7Days)
        .order('created_at', { ascending: false }),
      supabaseServer
        .from('venues')
        .select('id, name, created_at, profiles(full_name)')
        .eq('status', 'pending')
        .gte('created_at', last7Days)
        .order('created_at', { ascending: false }),
    ]);

    const notifications: Array<{
      id: string;
      type: 'user_signup' | 'venue_request';
      title: string;
      message: string;
      created_at: string;
      data?: unknown;
    }> = [];

    (newUsersResult.data || []).forEach((user) => {
      notifications.push({
        id: `user-${user.id}`,
        type: 'user_signup',
        title: 'New User Signup',
        message: `${user.full_name || 'New user'} signed up`,
        created_at: user.created_at,
        data: user,
      });
    });

    (pendingVenuesResult.data || []).forEach((venue: any) => {
      notifications.push({
        id: `venue-${venue.id}`,
        type: 'venue_request',
        title: 'New Venue Request',
        message: `${venue.profiles?.full_name || 'Unknown'} submitted "${venue.name}" for approval`,
        created_at: venue.created_at,
        data: venue,
      });
    });

    notifications.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { data: notifications, error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to load notifications' };
  }
}

export async function fetchAdminUsersWithVenueCounts() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: [], error: admin.error };

    const { data: profilesData, error } = await supabaseServer
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    const usersWithVenues = await Promise.all(
      (profilesData || []).map(async (profile) => {
        const { data: venues } = await supabaseServer
          .from('venues')
          .select('id, status')
          .eq('owner_id', profile.id);

        return {
          ...profile,
          venue_count: venues?.length || 0,
          approved_venues: venues?.filter((v) => v.status === 'approved').length || 0,
        };
      })
    );

    return { data: usersWithVenues, error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to load users' };
  }
}

export async function fetchAdminAnalyticsPage() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return { data: null, error: admin.error };

    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    const [venuesResult, usersResult, bookingsResult] = await Promise.all([
      supabaseServer.from('venues').select('*'),
      supabaseServer.from('profiles').select('*'),
      supabaseServer.from('bookings').select('*'),
    ]);

    const venues = venuesResult.data || [];
    const users = usersResult.data || [];
    const bookings = bookingsResult.data || [];

    const totalVenues = venues.length;
    const totalUsers = users.filter((u) => u.role !== 'admin').length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const venuesThisMonth = venues.filter((v) => v.created_at >= firstDayOfMonth).length;
    const usersThisMonth = users.filter(
      (u) => u.created_at >= firstDayOfMonth && u.role !== 'admin'
    ).length;
    const bookingsThisMonth = bookings.filter((b) => b.created_at >= firstDayOfMonth).length;
    const revenueThisMonth = bookings
      .filter(
        (b) =>
          (b.status === 'confirmed' || b.status === 'completed') &&
          b.created_at >= firstDayOfMonth
      )
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const sportCounts: Record<string, number> = {};
    venues.forEach((v) => {
      sportCounts[v.sport_type] = (sportCounts[v.sport_type] || 0) + 1;
    });
    const venuesBySport = Object.entries(sportCounts)
      .map(([sport, count]) => ({ sport, count }))
      .sort((a, b) => b.count - a.count);

    const cityCounts: Record<string, number> = {};
    venues.forEach((v) => {
      cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
    });
    const venuesByCity = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);

    return {
      data: {
        totalVenues,
        totalUsers,
        totalBookings,
        totalRevenue,
        venuesBySport,
        venuesByCity,
        growthStats: {
          venuesThisMonth,
          usersThisMonth,
          bookingsThisMonth,
          revenueThisMonth,
        },
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to load analytics' };
  }
}
