"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, Star, Loader2, Clock, Menu } from "lucide-react";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { LocationSelector } from "@/components/LocationSelector";
import { BannerAd, InFeedAd } from "@/components/ads/AdSenseUnit";
import ppLogo from "@/assets/pp logo.png";
import Image from "next/image";

type Venue = Tables<'venues'>;
type VenuePhoto = Tables<'venue_photos'>;
type SpecialOffer = Tables<'special_offers'>;

interface VenueWithPhotos extends Venue {
  venue_photos: VenuePhoto[];
  active_offer?: SpecialOffer | null;
  calculated_rating?: number;
  review_count?: number;
}

const formatTime = (time: string | null) => {
  if (!time) return 'N/A';
  try {
    // Parse time string (HH:mm:ss format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    // Format with leading zeros
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (e) {
    return 'N/A';
  }
};

const VENUES_PER_PAGE = 12;

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoized Venue Card component to prevent unnecessary re-renders
const VenueCard = memo(({ venue, primaryPhoto }: { venue: VenueWithPhotos; primaryPhoto: string | undefined }) => {
  const [imageError, setImageError] = useState(false);
  
  // Optimize Supabase images with transformation and cache parameters
  const optimizedPhoto = primaryPhoto && primaryPhoto.includes('supabase.co/storage')
    ? `${primaryPhoto}?width=500&height=300&quality=75&format=webp`
    : primaryPhoto;
  
  return (
    <Link href={`/venue/${venue.slug}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full">
        <div className="h-40 sm:h-48 bg-secondary/10 relative">
          {optimizedPhoto && !imageError ? (
            <img 
              src={optimizedPhoto} 
              alt={venue.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No photo
            </div>
          )}
          {Number(venue.calculated_rating) > 0 ? (
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-sm text-gray-900 px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              {venue.calculated_rating!.toFixed(1)}
              <span className="text-xs text-gray-600">({venue.review_count})</span>
            </div>
          ) : null}
        </div>
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">{venue.name}</h3>
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs sm:text-sm">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="line-clamp-1">
              {venue.address}, {venue.city}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-4 text-xs sm:text-sm">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">
              {venue.opening_time && venue.closing_time 
                ? `${formatTime(venue.opening_time)} - ${formatTime(venue.closing_time)}`
                : '24/7 Open'
              }
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
            <div className="min-w-0 flex-1">
              {venue.active_offer ? (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground">Starting from</p>
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                    <p className="text-lg sm:text-2xl font-bold text-primary whitespace-nowrap">
                      PKR {venue.active_offer.offer_price.toLocaleString()}/hr
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground line-through whitespace-nowrap">
                      PKR {venue.active_offer.original_price.toLocaleString()}
                    </p>
                  </div>
                  {venue.active_offer.discount_percentage && (
                    <Badge variant="destructive" className="text-xs">
                      {venue.active_offer.discount_percentage}% OFF
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground">Starting from</p>
                  <p className="text-lg sm:text-2xl font-bold text-primary whitespace-nowrap">
                    PKR {venue.price_per_hour.toLocaleString()}/hr
                  </p>
                </>
              )}
            </div>
            <Button className="w-full sm:w-auto">Book Now</Button>
          </div>
        </div>
      </Card>
    </Link>
  );
});

VenueCard.displayName = 'VenueCard';

interface VenuesPageClientProps {
  initialVenues?: VenueWithPhotos[];
  initialTotalCount?: number;
}

export default function VenuesPageClient({ initialVenues = [], initialTotalCount = 0 }: VenuesPageClientProps) {
  const searchParams = useSearchParams();
  const hasServerData = initialVenues.length > 0; // Track if we have SSR data
  const [venues, setVenues] = useState<VenueWithPhotos[]>(initialVenues);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialTotalCount > initialVenues.length);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedSubArea, setSelectedSubArea] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [priceSort, setPriceSort] = useState("none");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [offset, setOffset] = useState(hasServerData ? initialVenues.length : 0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(hasServerData); // Track if initial data loaded
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Load from cache immediately after mount
    const cachedRole = localStorage.getItem('user_role');
    if (cachedRole) {
      setUserRole(cachedRole);
    }
    
    checkUser();

    // Listen to auth changes for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUser(session.user);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role) {
            setUserRole(profile.role);
            localStorage.setItem('user_role', profile.role);
          }
        } else {
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('user_role');
        }
      } catch (error) {
        // Handle auth state change errors during logout/navigation
        console.error('Auth state change error:', error);
      }
    });
    
    const provinceParam = searchParams?.get('province');
    const cityParam = searchParams?.get('city');
    if (provinceParam) setSelectedProvince(provinceParam);
    if (cityParam) setSelectedCity(cityParam);
    
    setIsInitialized(true);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    // Skip initial fetch if we have server data and no filters are applied
    if (hasLoadedInitial && !debouncedSearchTerm && selectedProvince === "" && selectedCity === "" && selectedArea === "" && selectedSubArea === "" && selectedSport === "all" && priceSort === "none" && minPrice === "" && maxPrice === "") {
      setHasLoadedInitial(false); // Mark that we've checked initial load
      return;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const isFirstFetch = initialLoading;
    
    setOffset(0);
    setHasMore(true);
    
    if (!isFirstFetch) {
      setIsFiltering(true);
    }
    
    fetchVenues(0, isFirstFetch);
  }, [isInitialized, debouncedSearchTerm, selectedProvince, selectedCity, selectedArea, selectedSubArea, selectedSport, priceSort, minPrice, maxPrice]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading && !isFiltering) {
          loadMoreVenues();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, initialLoading, isFiltering, offset]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch fresh role from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role) {
          setUserRole(profile.role);
          localStorage.setItem('user_role', profile.role);
        }
      } else {
        localStorage.removeItem('user_role');
      }
    } catch (error) {
      // Silent fail
    }
  };

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'venue_owner') return '/owner/dashboard';
    return '/signin';
  };

  const getDashboardLabel = () => {
    if (userRole === 'admin') return 'Admin Dashboard';
    if (userRole === 'venue_owner') return 'Dashboard';
    return 'Sign In';
  };

  const fetchVenues = async (fetchOffset: number, isInitialFetch: boolean = false) => {
    abortControllerRef.current = new AbortController();
    
    try {
      if (isInitialFetch) {
        setInitialLoading(true);
      } else if (fetchOffset > 0) {
        setLoadingMore(true);
      }

      let query = supabase
        .from('venues')
        .select(`
          id,
          name,
          slug,
          address,
          city,
          province,
          area,
          sub_area,
          sport_type,
          price_per_hour,
          opening_time,
          closing_time,
          created_at
        `, { count: 'exact' })
        .eq('status', 'approved');

      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`);
      }

      if (selectedProvince) {
        query = query.eq('province', selectedProvince);
      }

      if (selectedCity) {
        query = query.eq('city', selectedCity);
      }

      if (selectedArea) {
        query = query.eq('area', selectedArea);
      }

      if (selectedSubArea) {
        query = query.eq('sub_area', selectedSubArea);
      }

      if (selectedSport !== 'all') {
        query = query.eq('sport_type', selectedSport as any);
      }

      const minPriceNum = minPrice ? parseFloat(minPrice) : null;
      const maxPriceNum = maxPrice ? parseFloat(maxPrice) : null;

      if (minPriceNum !== null) {
        query = query.gte('price_per_hour', minPriceNum);
      }

      if (maxPriceNum !== null) {
        query = query.lte('price_per_hour', maxPriceNum);
      }

      if (priceSort === 'low-to-high') {
        query = query.order('price_per_hour', { ascending: true });
      } else if (priceSort === 'high-to-low') {
        query = query.order('price_per_hour', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(fetchOffset, fetchOffset + VENUES_PER_PAGE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const venueIds = (data || []).map(v => v.id);
      
      if (venueIds.length === 0) {
        if (fetchOffset === 0) {
          setVenues([]);
          setTotalCount(count || 0);
        }
        setHasMore(false);
        setInitialLoading(false);
        setIsFiltering(false);
        setLoadingMore(false);
        return;
      }

      const [photosResult, offersResult, reviewsResult] = await Promise.all([
        supabase
          .from('venue_photos')
          .select('*')
          .in('venue_id', venueIds)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true }),
        supabase
          .from('special_offers')
          .select('*')
          .in('venue_id', venueIds)
          .eq('is_active', true)
          .lte('valid_from', new Date().toISOString())
          .gte('valid_until', new Date().toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('venue_reviews')
          .select('venue_id, rating')
          .in('venue_id', venueIds)
      ]);

      const photosByVenue = new Map<string, VenuePhoto[]>();
      (photosResult.data || []).forEach((photo: any) => {
        if (!photosByVenue.has(photo.venue_id)) {
          photosByVenue.set(photo.venue_id, []);
        }
        photosByVenue.get(photo.venue_id)!.push(photo as VenuePhoto);
      });

      const offersByVenue = new Map();
      (offersResult.data || []).forEach(offer => {
        if (!offersByVenue.has(offer.venue_id)) {
          offersByVenue.set(offer.venue_id, offer);
        }
      });

      const reviewsByVenue = new Map();
      (reviewsResult.data || []).forEach(review => {
        if (!reviewsByVenue.has(review.venue_id)) {
          reviewsByVenue.set(review.venue_id, []);
        }
        reviewsByVenue.get(review.venue_id).push(review);
      });

      const venuesWithData = (data || []).map((venue: any) => {
        const venueReviews = reviewsByVenue.get(venue.id) || [];
        const calculatedRating = venueReviews.length > 0
          ? venueReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / venueReviews.length
          : 0;

        const venuePhotos = photosByVenue.get(venue.id) || [];

        return {
          ...venue,
          venue_photos: venuePhotos,
          active_offer: offersByVenue.get(venue.id) || null,
          calculated_rating: calculatedRating,
          review_count: venueReviews.length
        };
      });

      if (fetchOffset === 0) {
        setVenues(venuesWithData);
        setTotalCount(count || 0);
      } else {
        setVenues(prev => [...prev, ...venuesWithData]);
      }
      
      const newOffset = fetchOffset + VENUES_PER_PAGE;
      setOffset(newOffset);
      setHasMore(count ? newOffset < count : false);
      
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error fetching venues:', error);
    } finally {
      setInitialLoading(false);
      setIsFiltering(false);
      setLoadingMore(false);
    }
  };

  const loadMoreVenues = useCallback(() => {
    if (loadingMore || !hasMore || initialLoading || isFiltering) return;
    fetchVenues(offset, false);
  }, [loadingMore, hasMore, initialLoading, isFiltering, offset]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedProvince("");
    setSelectedCity("");
    setSelectedArea("");
    setSelectedSubArea("");
    setSelectedSport("all");
    setPriceSort("none");
    setMinPrice("");
    setMaxPrice("");
  };

  const getPrimaryPhoto = useCallback((venue: VenueWithPhotos) => {
    if (!venue.venue_photos || venue.venue_photos.length === 0) {
      return undefined;
    }
    const primary = venue.venue_photos.find(p => p.is_primary);
    return primary?.photo_url || venue.venue_photos[0]?.photo_url;
  }, []);

  const venueGrid = useMemo(() => (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-200 ${isFiltering ? 'opacity-60' : 'opacity-100'}`}>
      {venues.map((venue, index) => (
        <>
          <VenueCard 
            key={venue.id} 
            venue={venue} 
            primaryPhoto={getPrimaryPhoto(venue)} 
          />
          
          {/* Show ad after every 6 venues */}
          {(index + 1) % 6 === 0 && index !== venues.length - 1 && (
            <div key={`ad-${index}`} className="col-span-full my-2">
              <InFeedAd />
            </div>
          )}
        </>
      ))}
    </div>
  ), [venues, getPrimaryPhoto, isFiltering]);

  if (initialLoading && venues.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src={ppLogo} alt="PakPlay" height={48} width={96} className="h-10 sm:h-12 w-auto" />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/venues">
              <Button variant="ghost">Browse Venues</Button>
            </Link>
            <Link href="/offers">
              <Button variant="ghost">Offers</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost">About Us</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Contact Us</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline">List Your Venue</Button>
            </Link>
            {mounted && (
              <Link href={getDashboardLink()}>
                <Button suppressHydrationWarning>{getDashboardLabel()}</Button>
              </Link>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/venues">
                  <Button variant="ghost" className="w-full justify-start">Browse Venues</Button>
                </Link>
                <Link href="/offers">
                  <Button variant="ghost" className="w-full justify-start">Offers</Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="ghost" className="w-full justify-start">Pricing</Button>
                </Link>
                <Link href="/about">
                  <Button variant="ghost" className="w-full justify-start">About Us</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" className="w-full justify-start">Contact Us</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">List Your Venue</Button>
                </Link>
                {mounted && (
                  <Link href={getDashboardLink()}>
                    <Button className="w-full" suppressHydrationWarning>{getDashboardLabel()}</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Discover Venues</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">Find the perfect sports venue for your next game</p>
        </div>

        {/* Filters */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="space-y-4">
            {/* First Row: Search and Sport Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Venue</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                <Input 
                    id="search"
                  placeholder="Search by venue name..." 
                  className="pl-9 sm:pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
              <div className="space-y-2">
                <Label htmlFor="sport">Sport Type</Label>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger id="sport">
                <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[200px] sm:max-h-[300px]">
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="cricket">Cricket</SelectItem>
                <SelectItem value="football">Football</SelectItem>
                <SelectItem value="futsal">Futsal</SelectItem>
                <SelectItem value="pickleball">Pickleball</SelectItem>
                <SelectItem value="badminton">Badminton</SelectItem>
                <SelectItem value="padel">Padel</SelectItem>
              </SelectContent>
            </Select>
              </div>
            </div>

            {/* Second Row: Location Selector */}
            <LocationSelector
              onLocationChange={(location) => {
                setSelectedProvince(location.province || "");
                setSelectedCity(location.city || "");
                setSelectedArea(location.area || "");
                setSelectedSubArea(location.subArea || "");
              }}
              initialProvince={selectedProvince}
              initialCity={selectedCity}
              initialArea={selectedArea}
              initialSubArea={selectedSubArea}
              required={false}
              showAllLevels={true}
            />

            {/* Third Row: Price Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="priceSort">Sort by Price</Label>
                <Select value={priceSort} onValueChange={setPriceSort}>
                  <SelectTrigger id="priceSort">
                    <SelectValue placeholder="Sort by Price" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low-to-high">Price: Low to High</SelectItem>
                    <SelectItem value="high-to-low">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minPrice">Min Price (PKR/hr)</Label>
                <Input 
                  id="minPrice"
                  type="number"
                  placeholder="e.g. 500"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max Price (PKR/hr)</Label>
                <Input 
                  id="maxPrice"
                  type="number"
                  placeholder="e.g. 5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Results Count and Clear Filters */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{venues.length}</span> of <span className="font-semibold text-foreground">{totalCount}</span> venue{totalCount !== 1 ? 's' : ''}
            </p>
            {isFiltering && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>
          {(searchTerm || selectedProvince || selectedCity || selectedArea || selectedSubArea || selectedSport !== 'all' || priceSort !== 'none' || minPrice || maxPrice) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllFilters}
              className="text-xs sm:text-sm"
            >
              Clear All Filters
            </Button>
          )}
        </div>

        {/* No Results */}
        {!initialLoading && !isFiltering && venues.length === 0 && (
          <Card className="p-6 sm:p-8 md:p-12 text-center">
            <h3 className="text-lg sm:text-xl font-bold mb-2">No venues found</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {totalCount === 0 
                ? "No venues have been listed yet. Be the first to list your venue!"
                : "Try adjusting your filters to see more results"}
            </p>
            {totalCount === 0 && (
              <Link href="/signup">
                <Button>List Your Venue</Button>
              </Link>
            )}
          </Card>
        )}

        {/* Banner Ad before venues */}
        <div className="mb-6">
          <BannerAd />
        </div>

        {/* Venue Grid */}
        {venueGrid}

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="mt-8 flex justify-center py-4">
          {loadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more venues...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
