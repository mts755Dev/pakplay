"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Calendar, User, Clock, DollarSign, MapPin, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { confirmOwnerBooking, deleteOwnerBooking } from "@/lib/server-actions";

interface OwnerBookingsClientProps {
  initialBookings?: any[] | null;
  userId: string;
}

export function OwnerBookingsClient({ initialBookings, userId }: OwnerBookingsClientProps) {
  const [bookings, setBookings] = useState<any[]>(() => {
    if (!initialBookings) return [];
    if (!Array.isArray(initialBookings)) return [];
    return initialBookings;
  });
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);

  const isBookingStartTimePassed = (bookingDate: string, startTime: string): boolean => {
    try {
      const now = new Date();
      const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
      return bookingDateTime < now;
    } catch {
      return false;
    }
  };

  const isBookingEndTimePassed = (bookingDate: string, endTime: string): boolean => {
    try {
      const now = new Date();
      const bookingDateTime = new Date(`${bookingDate}T${endTime}`);
      return bookingDateTime < now;
    } catch {
      return false;
    }
  };

  const getEffectiveStatus = (booking: any) => {
    const startTimePassed = isBookingStartTimePassed(booking.booking_date, booking.start_time);
    const endTimePassed = isBookingEndTimePassed(booking.booking_date, booking.end_time);

    if (booking.status === 'pending' && startTimePassed) {
      return 'expired';
    }

    if (booking.status === 'confirmed' && endTimePassed) {
      return 'completed';
    }

    return booking.status;
  };

  const visibleBookings = bookings.filter((booking) => getEffectiveStatus(booking) !== 'expired');

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500 text-white',
      confirmed: 'bg-green-500 text-white',
      cancelled: 'bg-red-500 text-white',
      completed: 'bg-blue-500 text-white',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const handleConfirmBooking = async (bookingId: string) => {
    setConfirmingBookingId(bookingId);
    try {
      const result = await confirmOwnerBooking(bookingId, userId);

      if (!result.success) {
        toast.error(result.error || "Failed to confirm booking");
        return;
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
      );
      toast.success("Booking confirmed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm booking");
    } finally {
      setConfirmingBookingId(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    setDeleting(true);
    try {
      const result = await deleteOwnerBooking(bookingId, userId);

      if (!result.success) {
        toast.error(result.error || "Failed to delete booking");
        return;
      }

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      toast.success("Booking deleted successfully!");
      setDeletingBookingId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete booking");
    } finally {
      setDeleting(false);
    }
  };

  const totalRevenue = visibleBookings
    .filter((b) => {
      const effectiveStatus = getEffectiveStatus(b);
      return effectiveStatus === 'confirmed' || effectiveStatus === 'completed';
    })
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="owner" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
            <p className="text-muted-foreground mt-1">View and manage all your venue bookings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <h3 className="text-3xl font-bold mt-2">{visibleBookings.length}</h3>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <h3 className="text-3xl font-bold mt-2 text-green-500">
                    {visibleBookings.filter((b) => getEffectiveStatus(b) === 'confirmed').length}
                  </h3>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <h3 className="text-3xl font-bold mt-2 text-yellow-500">
                    {visibleBookings.filter((b) => getEffectiveStatus(b) === 'pending').length}
                  </h3>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-2 text-primary">
                    PKR {totalRevenue.toLocaleString()}
                  </h3>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">All Bookings</h2>
              <Badge variant="secondary">{visibleBookings.length} total</Badge>
            </div>

            {visibleBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground">
                  Bookings for your venues will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleBookings.map((booking) => {
                  const effectiveStatus = getEffectiveStatus(booking);
                  return (
                    <Card key={booking.id} className="p-4 border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div>
                              <h3 className="font-bold text-lg">{booking.venues?.name || 'Unknown Venue'}</h3>
                              <Badge className={getStatusBadge(effectiveStatus)}>
                                {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-4 h-4" />
                              <div>
                                <p className="text-xs text-muted-foreground">Customer</p>
                                <p className="font-medium text-foreground">{booking.player_name || 'Unknown'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <div>
                                <p className="text-xs text-muted-foreground">Location</p>
                                <p className="font-medium text-foreground capitalize">{booking.venues?.city}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <div>
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="font-medium text-foreground">
                                  {new Date(booking.booking_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="w-4 h-4" />
                              <div>
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <p className="font-bold text-foreground">PKR {booking.total_price?.toLocaleString() || 0}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Time: {booking.start_time} - {booking.end_time}</span>
                            {booking.player_phone && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Phone: {booking.player_phone}</span>
                              </>
                            )}
                            {booking.notes && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Notes: {booking.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          {effectiveStatus === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmBooking(booking.id)}
                              disabled={confirmingBookingId === booking.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {confirmingBookingId === booking.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Confirm
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingBookingId(booking.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <AlertDialog
        open={!!deletingBookingId}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeletingBookingId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this booking record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting || !deletingBookingId}
              onClick={() => {
                if (deletingBookingId) {
                  handleDeleteBooking(deletingBookingId);
                }
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
