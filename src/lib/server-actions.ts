// Server-side data fetching utilities for SSR
// These are NOT hooks - they're server-only functions
"use server";

import { supabaseServer } from './supabase-server';
import { Tables, Database } from '@/integrations/supabase/types';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type Venue = Tables<'venues'>;
type VenuePhoto = Tables<'venue_photos'>;
type VenueReview = Tables<'venue_reviews'>;
type SpecialOffer = Tables<'special_offers'>;

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
 * Fetch initial venues for browse page
 */
export async function fetchInitialVenues(limit: number = 12) {
  try {
    const { data: venues, error, count } = await supabaseServer
      .from('venues')
      .select(`
        id, name, slug, address, city, province, area, sub_area,
        sport_type, price_per_hour, opening_time, closing_time, is_24_7, created_at,
        owner_id, description, amenities, whatsapp_number, google_maps_url, subdomain, is_featured,
        status, featured, rating, total_bookings, updated_at,
        logo_url, tagline, facebook_url, instagram_url
      `, { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    if (error || !venues) {
      return { venues: [], totalCount: 0 };
    }

    const venueIds = venues.map(v => v.id);
    if (venueIds.length === 0) {
      return { venues: [], totalCount: count || 0 };
    }

    const [photosResult, offersResult, reviewsResult] = await Promise.all([
      supabaseServer
        .from('venue_photos')
        .select('*')
        .in('venue_id', venueIds)
        .order('display_order', { ascending: true }),
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

    const photosMap = new Map<string, VenuePhoto[]>();
    (photosResult.data || []).forEach(photo => {
      if (!photosMap.has(photo.venue_id)) {
        photosMap.set(photo.venue_id, []);
      }
      photosMap.get(photo.venue_id)!.push(photo);
    });

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

    const venuesWithData = venues.map(venue => {
      const photos = photosMap.get(venue.id) || [];
      const offer = offersMap.get(venue.id);
      const rating = ratingsMap.get(venue.id);

      return {
        ...venue,
        venue_photos: photos,
        active_offer: offer || null,
        calculated_rating: rating ? rating.total / rating.count : 0,
        review_count: rating ? rating.count : 0,
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
 * Fetch initial offers for offers page
 */
export async function fetchInitialOffers(limit: number = 12) {
  try {
    const { data: offers, error, count } = await supabaseServer
      .from('special_offers')
      .select(`
        *,
        venues!inner(
          id, owner_id, name, slug, sport_type, city, province, area, sub_area,
          address, description, amenities, price_per_hour, opening_time, closing_time,
          is_24_7, whatsapp_number, google_maps_url, subdomain, is_featured, status,
          featured, rating, total_bookings, logo_url, tagline, facebook_url,
          instagram_url, created_at, updated_at
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .eq('venues.status', 'approved')
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    if (error || !offers) {
      return { offers: [], totalCount: 0 };
    }

    const venueIds = offers.map((o: any) => o.venues.id);
    if (venueIds.length === 0) {
      return { offers: offers || [], totalCount: count || 0 };
    }

    const [photosResult, reviewsResult] = await Promise.all([
      supabaseServer
        .from('venue_photos')
        .select('*')
        .in('venue_id', venueIds)
        .order('display_order', { ascending: true }),
      supabaseServer
        .from('venue_reviews')
        .select('venue_id, rating')
        .in('venue_id', venueIds)
    ]);

    const photosMap = new Map<string, VenuePhoto[]>();
    (photosResult.data || []).forEach(photo => {
      if (!photosMap.has(photo.venue_id)) {
        photosMap.set(photo.venue_id, []);
      }
      photosMap.get(photo.venue_id)!.push(photo);
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

    const offersWithData = offers.map((offer: any) => {
      const photos = photosMap.get(offer.venues.id) || [];
      const rating = ratingsMap.get(offer.venues.id);

      return {
        ...offer,
        venues: {
          ...offer.venues,
          venue_photos: photos,
          calculated_rating: rating ? rating.total / rating.count : 0,
          review_count: rating ? rating.count : 0,
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
 * Fetch a specific venue for editing (includes photos and pricing rules)
 */
export async function fetchVenueForEdit(venueId: string, userId: string) {
  try {
    const { data: venueData, error } = await supabaseServer
      .from('venues')
      .select('*, venue_photos(*), venue_pricing_rules(*)')
      .eq('id', venueId)
      .eq('owner_id', userId)
      .single();

    if (error || !venueData) {
      return null;
    }

    return venueData;
  } catch (error) {
    console.error('Error fetching venue for edit:', error);
    return null;
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

