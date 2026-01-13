"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Eye, CheckCircle, XCircle, Loader2, MapPin, Users, Filter } from "lucide-react";
import { toast } from "sonner";
import { LocationSelector } from "@/components/LocationSelector";

const VENUES_PER_PAGE = 20;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

interface AdminVenuesClientProps {
  initialVenues?: any[];
}

export function AdminVenuesClient({ initialVenues }: AdminVenuesClientProps = {}) {
  const [user, setUser] = useState<any>(null);
  const [venues, setVenues] = useState<any[]>(initialVenues || []);
  const [loading, setLoading] = useState(!initialVenues);
  const [loadingMore, setLoadingMore] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [venueLoading, setVenueLoading] = useState(false);
  
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Stats (fetched separately, only once)
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  
  // Refs
  const observerTarget = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  
  // Debounce search
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    checkUser();
  }, []);

  // Fetch venues when filters change
  useEffect(() => {
    if (!user || !isInitialized.current) return;
    
    // Reset and fetch with new filters
    setVenues([]);
    setOffset(0);
    setHasMore(true);
    fetchVenues(0, true);
  }, [debouncedSearchQuery, statusFilter, provinceFilter, cityFilter, sportFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
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
  }, [hasMore, loadingMore, loading, offset]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          toast.error("Access denied. Admin only.");
          window.location.href = '/';
          return;
        }

        setUser(user);
        isInitialized.current = true;
        
        if (!initialVenues) {
          // Fetch stats and initial venues in parallel
          await Promise.all([
            fetchStats(),
            fetchVenues(0, true)
          ]);
        } else {
          // Just fetch stats if venues already provided
          await fetchStats();
        }
      } else {
        window.location.href = '/admin';
      }
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get counts for each status
      const [totalRes, approvedRes, pendingRes, rejectedRes] = await Promise.all([
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      ]);

      setStats({
        total: totalRes.count || 0,
        approved: approvedRes.count || 0,
        pending: pendingRes.count || 0,
        rejected: rejectedRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVenues = async (fetchOffset: number, isNewSearch: boolean = false) => {
    try {
      if (isNewSearch) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Build query with server-side filtering
      let query = supabase
        .from('venues')
        .select(`
          id,
          name,
          slug,
          city,
          province,
          sport_type,
          status,
          featured,
          owner_id,
          created_at
        `, { count: 'exact' });

      // Apply filters
      if (debouncedSearchQuery) {
        query = query.or(`name.ilike.%${debouncedSearchQuery}%,city.ilike.%${debouncedSearchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'approved' | 'pending' | 'rejected');
      }

      if (provinceFilter) {
        query = query.eq('province', provinceFilter);
      }

      if (cityFilter) {
        query = query.eq('city', cityFilter);
      }

      if (sportFilter !== 'all') {
        query = query.eq('sport_type', sportFilter as 'football' | 'cricket' | 'basketball' | 'tennis' | 'badminton' | 'volleyball' | 'table-tennis' | 'squash' | 'padel' | 'futsal' | 'hockey' | 'swimming' | 'boxing' | 'martial-arts' | 'gym' | 'snooker' | 'golf' | 'kabaddi' | 'athletics' | 'cycling' | 'multi-sport');
      }

      // Sort: featured first, then by created_at
      query = query
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(fetchOffset, fetchOffset + VENUES_PER_PAGE - 1);

      const { data: venuesData, error, count } = await query;

      if (error) throw error;

      if (!venuesData || venuesData.length === 0) {
        if (isNewSearch) {
          setVenues([]);
          setTotalCount(count || 0);
        }
        setHasMore(false);
        return;
      }

      // Get venue IDs and owner IDs for batch queries
      const venueIds = venuesData.map(v => v.id);
      const ownerIds = [...new Set(venuesData.map(v => v.owner_id).filter((id): id is string => id !== null))];

      // Batch fetch profiles and first 4 photos per venue
      const [profilesData, photosData] = await Promise.all([
        ownerIds.length > 0 ? supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', ownerIds) : Promise.resolve({ data: [], error: null }),
        supabase
          .from('venue_photos')
          .select('id, venue_id, photo_url, display_order')
          .in('venue_id', venueIds)
          .order('display_order', { ascending: true })
      ]);

      // Create lookup maps
      const profilesMap = new Map();
      (profilesData.data || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Only keep first 4 photos per venue
      const photosMap = new Map();
      (photosData.data || []).forEach(photo => {
        if (!photosMap.has(photo.venue_id)) {
          photosMap.set(photo.venue_id, []);
        }
        const photos = photosMap.get(photo.venue_id);
        if (photos.length < 4) {
          photos.push(photo);
        }
      });

      // Combine data
      const venuesWithData = venuesData.map(venue => ({
        ...venue,
        profiles: profilesMap.get(venue.owner_id),
        venue_photos: photosMap.get(venue.id) || []
      }));

      if (isNewSearch) {
        setVenues(venuesWithData);
        setTotalCount(count || 0);
      } else {
        setVenues(prev => [...prev, ...venuesWithData]);
      }

      // Check if there's more
      const newOffset = fetchOffset + VENUES_PER_PAGE;
      setOffset(newOffset);
      setHasMore(count ? newOffset < count : false);

    } catch (error) {
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreVenues = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    fetchVenues(offset, false);
  }, [loadingMore, hasMore, loading, offset]);

  const handleStatusChange = async (venueId: string, newStatus: string) => {
    setActionLoading(venueId);
    try {
      const { error } = await supabase
        .from('venues')
        .update({ status: newStatus as 'approved' | 'pending' | 'rejected' | 'inactive' })
        .eq('id', venueId);

      if (error) throw error;

      toast.success(`Venue ${newStatus} successfully!`);
      
      // Update local state instead of refetching everything
      setVenues(prev => prev.map(v => 
        v.id === venueId ? { ...v, status: newStatus as any } : v
      ));
      
      // Update stats
      fetchStats();
      
      if (isDetailModalOpen && selectedVenue?.id === venueId) {
        setSelectedVenue((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update venue");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (venueId: string, featured: boolean) => {
    setActionLoading(venueId);
    try {
      const { error } = await supabase
        .from('venues')
        .update({ featured })
        .eq('id', venueId);

      if (error) throw error;

      toast.success(featured ? "Venue set as featured" : "Venue removed from featured");
      
      // Update local state
      setVenues(prev => prev.map(v => 
        v.id === venueId ? { ...v, featured } : v
      ));
    } catch (error: any) {
      toast.error(error.message || "Failed to update featured status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (venueId: string) => {
    setVenueLoading(true);
    setIsDetailModalOpen(true);
    
    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select(`
          *,
          venue_photos(*),
          venue_pricing_rules(*)
        `)
        .eq('id', venueId)
        .single();

      if (venueError) throw venueError;

      let profileData = null;
      if (venueData.owner_id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone, whatsapp_number')
          .eq('id', venueData.owner_id)
          .single();
        profileData = data;
      }

      const venueWithProfile = {
        ...venueData,
        profiles: profileData
      };

      setSelectedVenue(venueWithProfile);
    } catch (error: any) {
      toast.error("Failed to load venue details");
      setIsDetailModalOpen(false);
    } finally {
      setVenueLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500 text-white',
      approved: 'bg-green-500 text-white',
      rejected: 'bg-red-500 text-white',
      inactive: 'bg-gray-500 text-white',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProvinceFilter("");
    setCityFilter("");
    setSportFilter("all");
  };

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="admin" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">All Venues</h1>
            <p className="text-muted-foreground mt-1">Manage all venues on the platform</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
                </div>
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <h3 className="text-3xl font-bold mt-2 text-green-500">{stats.approved}</h3>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <h3 className="text-3xl font-bold mt-2 text-yellow-500">{stats.pending}</h3>
                </div>
                <CheckCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <h3 className="text-3xl font-bold mt-2 text-red-500">{stats.rejected}</h3>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            <div className="space-y-4">
              {/* First Row: Search, Status, and Sport */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Venue</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search venues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport Type</Label>
                  <Select value={sportFilter} onValueChange={setSportFilter}>
                    <SelectTrigger id="sport">
                      <SelectValue placeholder="All Sports" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[300px]">
                      <SelectItem value="all">All Sports</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="cricket">Cricket</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="badminton">Badminton</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="table-tennis">Table Tennis</SelectItem>
                      <SelectItem value="squash">Squash</SelectItem>
                      <SelectItem value="padel">Padel</SelectItem>
                      <SelectItem value="futsal">Futsal</SelectItem>
                      <SelectItem value="hockey">Hockey</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="multi-sport">Multi-Sport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Second Row: Location Selector (Province, City) */}
              <LocationSelector
                onLocationChange={(location) => {
                  setProvinceFilter(location.province || "");
                  setCityFilter(location.city || "");
                }}
                initialProvince={provinceFilter}
                initialCity={cityFilter}
                required={false}
                showAllLevels={false}
              />

              {/* Clear Filters */}
              {(searchQuery || statusFilter !== 'all' || provinceFilter || cityFilter || sportFilter !== 'all') && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Venues List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Venues</h2>
                <span className="text-muted-foreground">
                  ({venues.length} of {totalCount})
                </span>
                {loading && venues.length > 0 && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
              </div>
            </div>

            {loading && venues.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="p-4 border">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1 space-y-4">
                        <div>
                          <Skeleton className="h-6 w-48 mb-2" />
                          <div className="flex items-center gap-4 mt-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-28" />
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Skeleton className="h-9 w-32" />
                          <Skeleton className="h-9 w-24" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex gap-2">
                          <Skeleton className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg" />
                          <Skeleton className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg" />
                          <Skeleton className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg" />
                          <Skeleton className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg" />
                        </div>
                      </div>
                      <div className="flex lg:flex-col items-start">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : venues.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No venues found</h3>
                <p className="text-muted-foreground">
                  {totalCount === 0 ? "No venues on the platform yet" : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {venues.map((venue) => (
                  <Card key={venue.id} className="p-4 border">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left: Info & Buttons */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg">{venue.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span className="capitalize">{venue.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              <span className="capitalize">{venue.sport_type.replace('-', ' ')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{venue.profiles?.full_name || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(venue.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          {venue.status !== 'approved' && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleStatusChange(venue.id, 'approved')}
                              disabled={actionLoading === venue.id}
                            >
                              {actionLoading === venue.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Approve
                            </Button>
                          )}
                          {venue.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(venue.id, 'rejected')}
                              disabled={actionLoading === venue.id}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          )}
                          {venue.status === 'approved' && (
                            <Button
                              size="sm"
                              variant={venue.featured ? "secondary" : "outline"}
                              onClick={() => handleToggleFeatured(venue.id, !venue.featured)}
                              disabled={actionLoading === venue.id}
                            >
                              {venue.featured ? "⭐ Featured" : "Set Featured"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Center: Photos - Horizontal Inline */}
                      {venue.venue_photos && venue.venue_photos.length > 0 && (
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                          <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
                            {venue.venue_photos
                              .sort((a: any, b: any) => a.display_order - b.display_order)
                              .map((photo: any, index: number) => {
                                const thumbnailUrl = photo.photo_url.includes('supabase.co/storage')
                                  ? `${photo.photo_url}?width=200&height=150&quality=75`
                                  : photo.photo_url;
                                
                                return (
                                  <div key={photo.id} className="shrink-0">
                                    <img
                                      src={thumbnailUrl}
                                      alt={`${venue.name} ${index + 1}`}
                                      loading="lazy"
                                      decoding="async"
                                      className="h-16 w-24 sm:h-20 sm:w-28 object-cover rounded-lg border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer"
                                      onClick={() => handleViewDetails(venue.id)}
                                    />
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Right: Status Badge */}
                      <div className="flex lg:flex-col items-start justify-start">
                        <Badge className={getStatusBadge(venue.status)}>
                          {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="mt-8 flex justify-center py-4">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more venues...</span>
                </div>
              )}
            </div>
          </Card>

          {/* Venue Detail Modal */}
          <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Venue Details</DialogTitle>
              </DialogHeader>
              
              {venueLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading venue details...</p>
                </div>
              ) : selectedVenue ? (
                <div className="space-y-6">
                  {/* Photos Gallery */}
                  {selectedVenue.venue_photos && selectedVenue.venue_photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedVenue.venue_photos
                        .sort((a: any, b: any) => a.display_order - b.display_order)
                        .map((photo: any, index: number) => {
                          const thumbnailUrl = photo.photo_url.includes('supabase.co/storage')
                            ? `${photo.photo_url}?width=400&height=300&quality=80`
                            : photo.photo_url;
                          
                          return (
                            <img
                              key={photo.id}
                              src={thumbnailUrl}
                              alt={`${selectedVenue.name} ${index + 1}`}
                              loading="lazy"
                              className="w-full h-24 sm:h-32 object-cover rounded-lg border-2 border-gray-100 hover:border-primary transition-colors"
                            />
                          );
                        })}
                    </div>
                  )}

                  {/* Basic Info */}
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedVenue.name}</h3>
                    <Badge className={
                      selectedVenue.status === 'approved' ? 'bg-green-500' :
                      selectedVenue.status === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }>
                      {selectedVenue.status.charAt(0).toUpperCase() + selectedVenue.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sport Type</p>
                      <p className="font-semibold capitalize">{selectedVenue.sport_type.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">City</p>
                      <p className="font-semibold capitalize">{selectedVenue.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Base Price</p>
                      <p className="font-semibold">PKR {selectedVenue.price_per_hour}/hr</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Operating Hours</p>
                      <p className="font-semibold">
                        {selectedVenue.is_24_7 ? '24/7' : `${selectedVenue.opening_time} - ${selectedVenue.closing_time}`}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedVenue.address}</p>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{selectedVenue.description}</p>
                  </div>

                  {/* Amenities */}
                  {selectedVenue.amenities && selectedVenue.amenities.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedVenue.amenities.map((amenity: string) => (
                          <Badge key={amenity} variant="secondary">{amenity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Pricing */}
                  {selectedVenue.venue_pricing_rules && selectedVenue.venue_pricing_rules.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Dynamic Pricing Rules</p>
                      <div className="space-y-2">
                        {selectedVenue.venue_pricing_rules.map((rule: any) => (
                          <div key={rule.id} className="border rounded p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {rule.day_of_week !== null ? 
                                  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][rule.day_of_week] : 
                                  'All Days'
                                }
                                {rule.start_time && rule.end_time && 
                                  ` • ${rule.start_time} - ${rule.end_time}`
                                }
                              </span>
                              <span className="font-bold">PKR {rule.price_per_hour}/hr</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Owner Info */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Owner Information</p>
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="font-semibold">{selectedVenue.profiles?.full_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <span className="font-semibold">{selectedVenue.profiles?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">WhatsApp</span>
                        <span className="font-semibold">{selectedVenue.whatsapp_number || selectedVenue.profiles?.whatsapp_number || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedVenue.status !== 'approved' && (
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={() => handleStatusChange(selectedVenue.id, 'approved')}
                        disabled={actionLoading === selectedVenue.id}
                      >
                        {actionLoading === selectedVenue.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                    )}
                    {selectedVenue.status !== 'rejected' && (
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleStatusChange(selectedVenue.id, 'rejected')}
                        disabled={actionLoading === selectedVenue.id}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
