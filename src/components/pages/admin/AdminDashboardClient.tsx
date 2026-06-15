"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  getAdminSession,
  fetchAdminPendingVenues,
  fetchAdminVenueDetail,
  fetchAdminLocationStats,
  fetchAdminDashboard,
  updateAdminVenueStatus,
} from "@/lib/server-actions";
import { Building2, Calendar, Users, CheckCircle, XCircle, Eye, Loader2, MapPin, X, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllProvinces, getCityById } from "@/lib/locationHelpers";

interface AdminDashboardClientProps {
  initialStats?: any;
}

export function AdminDashboardClient({ initialStats }: AdminDashboardClientProps = {}) {
  const [user, setUser] = useState<any>(null);
  const [pendingVenues, setPendingVenues] = useState<any[]>([]);
  const [stats, setStats] = useState(initialStats || {
    totalVenues: 0,
    approvedVenues: 0,
    pendingVenues: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [locationStats, setLocationStats] = useState<{province: string, count: number, provinceName: string}[]>([]);
  const [loading, setLoading] = useState(!initialStats);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [venueLoading, setVenueLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await getAdminSession();
      if (!session.success || !session.user) {
        if (session.error && session.error !== 'Not authenticated') {
          toast.error("Access denied. Admin only.");
          window.location.href = "/";
          return;
        }
        window.location.href = "/admin";
        return;
      }

      setUser(session.user);
      if (!initialStats) {
        fetchPendingVenues();
        fetchStats();
        fetchLocationStats();
      }
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchPendingVenues = async () => {
    try {
      const { data, error } = await fetchAdminPendingVenues();
      if (error) {
        toast.error(error || "Failed to load pending venues");
        setPendingVenues([]);
        return;
      }
      setPendingVenues(data);
    } catch {
      toast.error("Failed to load pending venues");
      setPendingVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const dashboard = await fetchAdminDashboard();
      setStats({
        totalVenues: dashboard.totalVenues,
        approvedVenues: dashboard.approvedVenues,
        pendingVenues: dashboard.pendingVenues,
        totalUsers: dashboard.totalUsers,
        totalBookings: dashboard.totalBookings,
        totalRevenue: dashboard.totalRevenue,
      });
    } catch {
      toast.error("Failed to load dashboard stats");
    }
  };

  const fetchLocationStats = async () => {
    try {
      const { data, error } = await fetchAdminLocationStats();
      if (error) {
        toast.error(error || "Failed to load location stats");
        return;
      }

      const provinces = getAllProvinces();
      const locationData = data.map((stat) => ({
        province: stat.province,
        count: stat.count,
        provinceName: provinces.find((p) => p.id === stat.province)?.name || stat.province,
      }));

      setLocationStats(locationData);
    } catch {
      toast.error("Failed to load location stats");
    }
  };

  const handleApprove = async (venueId: string) => {
    setActionLoading(venueId);
    try {
      const result = await updateAdminVenueStatus(venueId, 'approved');
      if (!result.success) throw new Error(result.error);

      toast.success("Venue approved successfully!");
      fetchPendingVenues();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve venue");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (venueId: string) => {
    setActionLoading(venueId);
    try {
      const result = await updateAdminVenueStatus(venueId, 'rejected');
      if (!result.success) throw new Error(result.error);

      toast.success("Venue rejected");
      fetchPendingVenues();
      fetchStats();
      if (isDetailModalOpen && selectedVenue?.id === venueId) {
        setIsDetailModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reject venue");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (venueId: string) => {
    setVenueLoading(true);
    setIsDetailModalOpen(true);

    try {
      const { data, error } = await fetchAdminVenueDetail(venueId);
      if (error || !data) throw new Error(error || "Venue not found");

      setSelectedVenue(data);
    } catch {
      toast.error("Failed to load venue details");
      setIsDetailModalOpen(false);
    } finally {
      setVenueLoading(false);
    }
  };

  // Show nothing while checking authentication
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

  // Don't render dashboard until user is confirmed and is admin
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="admin" />
      
      <div className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 md:p-8 pt-20 lg:pt-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage venues, users, and platform settings</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Venues</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalVenues}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-green-500">{stats.approvedVenues}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending Review</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-yellow-500">{stats.pendingVenues}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalUsers}</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          {/* Location Analytics */}
          {locationStats.length > 0 && (
            <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold">Top Venues by Province</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {locationStats.map((stat, index) => (
                  <div key={stat.province} className="flex items-center justify-between py-2 sm:py-3 border-b last:border-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{stat.provinceName}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Province</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xl sm:text-2xl font-bold text-primary">{stat.count}</p>
                      <p className="text-xs text-muted-foreground">venues</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pending Venues */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Pending Venue Approvals</h2>
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">{pendingVenues.length} pending</Badge>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 sm:p-6 border-2">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left: Info Skeleton */}
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Skeleton className="h-10 w-full sm:flex-1" />
                          <Skeleton className="h-10 w-full sm:w-24" />
                          <Skeleton className="h-10 w-full sm:w-20" />
                        </div>
                      </div>
                      {/* Center: Photos Skeleton */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex gap-2">
                          <Skeleton className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg" />
                          <Skeleton className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg" />
                          <Skeleton className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg" />
                          <Skeleton className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg" />
                        </div>
                      </div>
                      {/* Right: Badge Skeleton */}
                      <div className="flex lg:flex-col items-start">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : pendingVenues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  No pending venues to review
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingVenues.map((venue) => (
                  <Card key={venue.id} className="p-4 sm:p-6 border-2 border-yellow-500/20">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left: Info & Buttons */}
                      <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                          <h3 className="font-bold text-lg sm:text-xl">{venue.name}</h3>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                              <span className="capitalize">{venue.city}</span>
                            </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                              <span className="capitalize">{venue.sport_type.replace('-', ' ')}</span>
                            </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                              <span>Owner: {venue.profiles?.full_name || 'Unknown'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="outline" 
                            className="w-full sm:flex-1"
                            onClick={() => handleViewDetails(venue.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="default"
                            className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
                            onClick={() => handleApprove(venue.id)}
                            disabled={actionLoading === venue.id}
                          >
                            {actionLoading === venue.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            className="w-full sm:w-auto"
                            onClick={() => handleReject(venue.id)}
                            disabled={actionLoading === venue.id}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      {/* Center: Photos - Horizontal Inline */}
                      {venue.venue_photos && venue.venue_photos.length > 0 && (
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                          <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
                            {venue.venue_photos
                              .sort((a: any, b: any) => a.display_order - b.display_order)
                              .map((photo: any, index: number) => {
                                // Use Supabase image transformation for smaller thumbnails
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
                      <div className="flex lg:flex-col items-start justify-start lg:justify-start">
                        <Badge className="bg-yellow-500 shrink-0">Pending</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Venue Detail Modal */}
          <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl">Venue Details</DialogTitle>
              </DialogHeader>
              
              {venueLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading venue details...</p>
                </div>
              ) : selectedVenue ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Photos Gallery */}
                  {selectedVenue.venue_photos && selectedVenue.venue_photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedVenue.venue_photos
                        .sort((a: any, b: any) => a.display_order - b.display_order)
                        .map((photo: any, index: number) => {
                          // Use Supabase image transformation for thumbnails in modal
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
                    <h3 className="text-lg sm:text-xl font-bold mb-2">{selectedVenue.name}</h3>
                    <Badge className={
                      selectedVenue.status === 'approved' ? 'bg-green-500' :
                      selectedVenue.status === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }>
                      {selectedVenue.status.charAt(0).toUpperCase() + selectedVenue.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Sport Type</p>
                      <p className="font-semibold text-sm sm:text-base capitalize">{selectedVenue.sport_type.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">City</p>
                      <p className="font-semibold text-sm sm:text-base capitalize">{selectedVenue.city}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Base Price</p>
                      <p className="font-semibold text-sm sm:text-base">PKR {selectedVenue.price_per_hour}/hr</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Operating Hours</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedVenue.is_24_7 ? '24/7' : `${selectedVenue.opening_time} - ${selectedVenue.closing_time}`}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Address</p>
                    <p className="font-medium text-sm sm:text-base">{selectedVenue.address}</p>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Description</p>
                    <p className="text-xs sm:text-sm mt-1">{selectedVenue.description}</p>
                  </div>

                  {/* Amenities */}
                  {selectedVenue.amenities && selectedVenue.amenities.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedVenue.amenities.map((amenity: string) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">{amenity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Pricing */}
                  {selectedVenue.venue_pricing_rules && selectedVenue.venue_pricing_rules.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">Dynamic Pricing Rules</p>
                      <div className="space-y-2">
                        {selectedVenue.venue_pricing_rules.map((rule: any) => (
                          <div key={rule.id} className="border rounded p-2 sm:p-3 text-xs sm:text-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
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
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Owner Information</p>
                    <div className="border rounded-lg p-3 sm:p-4 space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Name</span>
                        <span className="font-semibold text-xs sm:text-sm text-right">{selectedVenue.profiles?.full_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Phone</span>
                        <span className="font-semibold text-xs sm:text-sm text-right">{selectedVenue.profiles?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">WhatsApp</span>
                        <span className="font-semibold text-xs sm:text-sm text-right break-all">{selectedVenue.whatsapp_number || selectedVenue.profiles?.whatsapp_number || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedVenue.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={() => handleApprove(selectedVenue.id)}
                        disabled={actionLoading === selectedVenue.id}
                      >
                        {actionLoading === selectedVenue.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve Venue
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(selectedVenue.id)}
                        disabled={actionLoading === selectedVenue.id}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Venue
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

