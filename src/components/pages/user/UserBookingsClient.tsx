"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, User, DollarSign, Loader2, ArrowLeft, Filter } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserBookings } from "@/lib/server-actions";

interface Booking {
  id: string;
  venue_name: string;
  venue_image?: string;
  venue_slug?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  total_price: number;
  total_hours: number;
  player_name: string;
  player_email: string;
  player_phone: string;
  created_at: string;
}

const getStatusBadge = (status: string) => {
  const colors = {
    pending: 'bg-yellow-500 text-white',
    confirmed: 'bg-green-500 text-white',
    cancelled: 'bg-red-500 text-white',
    completed: 'bg-blue-500 text-white',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatTime = (time: string) => {
  if (!time) return 'N/A';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export function UserBookingsClient() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const fetchedEmailRef = useRef<string | null>(null);

  // Helper function to check if booking start time has passed
  const isBookingStartTimePassed = (bookingDate: string, startTime: string): boolean => {
    try {
      const now = new Date();
      const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
      return bookingDateTime < now;
    } catch (error) {
      console.error('Error checking booking time:', error);
      return false;
    }
  };

  // Helper function to check if booking end time has passed
  const isBookingEndTimePassed = (bookingDate: string, endTime: string): boolean => {
    try {
      const now = new Date();
      const bookingDateTime = new Date(`${bookingDate}T${endTime}`);
      return bookingDateTime < now;
    } catch (error) {
      console.error('Error checking booking time:', error);
      return false;
    }
  };

  // Helper function to delete expired pending bookings
  const deleteExpiredPendingBookings = async (bookingsToCheck: Booking[]) => {
    const expiredBookingIds = bookingsToCheck
      .filter(booking => {
        // Pending bookings with passed start time should be deleted
        return booking.status === 'pending' && isBookingStartTimePassed(booking.booking_date, booking.start_time);
      })
      .map(booking => booking.id);

    if (expiredBookingIds.length > 0) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .in('id', expiredBookingIds);

        if (error) {
          console.error('Error deleting expired bookings:', error);
        }
      } catch (error) {
        console.error('Error deleting expired bookings:', error);
      }
    }
  };

  // Helper function to auto-complete confirmed bookings with passed end time
  const autoCompleteBookings = async (bookingsToCheck: Booking[]) => {
    const bookingsToComplete = bookingsToCheck
      .filter(booking => {
        // Only update if status is still 'confirmed' in DB but end time has passed
        return booking.status === 'confirmed' && isBookingEndTimePassed(booking.booking_date, booking.end_time);
      })
      .map(booking => booking.id);

    if (bookingsToComplete.length > 0) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .in('id', bookingsToComplete);

        if (error) {
          console.error('Error auto-completing bookings:', error);
        }
      } catch (error) {
        console.error('Error auto-completing bookings:', error);
      }
    }
  };

  const fetchBookings = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setUserEmail(email);

      const { data, error } = await fetchUserBookings(email);

      if (error) throw error;

      const formattedBookings: Booking[] = (data || []).map((booking: any) => {
        const photos = booking.venues?.venue_photos || [];
        const sortedPhotos = photos.sort((a: any, b: any) => a.display_order - b.display_order);
        const firstPhoto = sortedPhotos[0]?.photo_url || null;

        return {
          id: booking.id,
          venue_name: booking.venues?.name || 'Unknown Venue',
          venue_slug: booking.venues?.slug || null,
          venue_image: firstPhoto,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          total_price: booking.total_price,
          total_hours: booking.total_hours || 1,
          player_name: booking.player_name,
          player_email: booking.player_email,
          player_phone: booking.player_phone,
          created_at: booking.created_at,
        };
      });

      // Update local state immediately — don't wait for background DB cleanup
      // Update the status in the local state for bookings that were auto-completed
      const updatedBookings = formattedBookings.map(booking => {
        if (booking.status === 'confirmed' && isBookingEndTimePassed(booking.booking_date, booking.end_time)) {
          return { ...booking, status: 'completed' as const };
        }
        return booking;
      });
      
      // Filter out the expired pending bookings from the state
      const nonExpiredBookings = updatedBookings.filter(booking => {
        return !(booking.status === 'pending' && isBookingStartTimePassed(booking.booking_date, booking.start_time));
      });
      
      setBookings(nonExpiredBookings);

      // Run DB cleanup in background — don't block the UI
      if (formattedBookings.length > 0) {
        autoCompleteBookings(formattedBookings).catch(() => {});
        deleteExpiredPendingBookings(formattedBookings).catch(() => {});
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error(error.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Use cached email from AuthContext — no extra network call needed
    const email = user?.email;
    
    // Only fetch if email changed or hasn't been fetched
    if (email && email !== fetchedEmailRef.current) {
      fetchedEmailRef.current = email;
      fetchBookings(email);
    } else if (!isLoggedIn && !user) {
      // Not logged in at all — stop loading
      setLoading(false);
    }
  }, [user, isLoggedIn]);

  const handleCancelBooking = async () => {
    if (!cancellingId) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', cancellingId);

      if (error) throw error;

      setBookings(prev => 
        prev.map(b => 
          b.id === cancellingId ? { ...b, status: 'cancelled' as const } : b
        )
      );

      toast.success("Booking cancelled successfully!");
      setCancellingId(null);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || "Failed to cancel booking");
      setCancellingId(null);
    }
  };

  const getFilteredBookings = () => {
    return bookings.filter((booking) => {
      // Check if booking has ended (using end time, not just date)
      const hasEnded = isBookingEndTimePassed(booking.booking_date, booking.end_time);
      
      if (filter === 'upcoming') {
        // Upcoming: not ended yet, and not cancelled or completed
        return !hasEnded && booking.status !== 'cancelled' && booking.status !== 'completed';
      } else if (filter === 'past') {
        // Past: either ended, or status is cancelled/completed
        return hasEnded || booking.status === 'cancelled' || booking.status === 'completed';
      }
      return true;
    });
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Bookings</h1>
              <p className="text-sm text-white/80 mt-1">View and manage your venue bookings</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? '' : 'text-white hover:bg-white/20'}
            >
              All Bookings
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('upcoming')}
              className={filter === 'upcoming' ? '' : 'text-white hover:bg-white/20'}
            >
              Upcoming
            </Button>
            <Button
              variant={filter === 'past' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('past')}
              className={filter === 'past' ? '' : 'text-white hover:bg-white/20'}
            >
              Past
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === 'all' 
                ? "You haven't made any bookings yet. Start exploring venues!"
                : filter === 'upcoming'
                ? "You don't have any upcoming bookings."
                : "You don't have any past bookings."}
            </p>
            <Link href="/venues">
              <Button>Browse Venues</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Venue Image */}
                  {booking.venue_image && (
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0">
                      <Image
                        src={booking.venue_image}
                        alt={booking.venue_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 192px"
                      />
                    </div>
                  )}

                  {/* Booking Details */}
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{booking.venue_name}</h3>
                        <Badge className={getStatusBadge(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-primary">
                          PKR {booking.total_price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.player_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.total_hours} hour(s)</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {booking.venue_slug && (
                        <Link href={`/venue/${booking.venue_slug}`}>
                          <Button variant="outline" size="sm">
                            View Venue
                          </Button>
                        </Link>
                      )}
                      {booking.status === 'pending' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancellingId(booking.id)}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} className="bg-destructive hover:bg-destructive/90">
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
