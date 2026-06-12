"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import { Calendar, User, Clock, Banknote, MapPin, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BookingDiscountBadge } from "@/components/BookingDiscountBadge";
import { OwnerBookingDateFilter } from "@/components/owner/OwnerBookingDateFilter";
import { autoCompleteOwnerBookings, confirmOwnerBooking, deleteOwnerBooking } from "@/lib/server-actions";
import {
  canOwnerDeleteBooking,
  countsTowardRevenue,
  getEffectiveBookingStatus,
  isBookingEffectivelyCompleted,
  matchesBookingDate,
  sortBookingsForOwnerDisplay,
} from "@/lib/booking-status";

const DATE_FILTER_PARAM = "date";

function isValidDateFilter(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return isValid(parseISO(value));
}

function getTodayDateKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function formatFilterDateLabel(value: string): string {
  try {
    return format(parseISO(value), "EEEE, d MMMM yyyy");
  } catch {
    return value;
  }
}

interface OwnerBookingsClientProps {
  initialBookings?: any[] | null;
  userId: string;
}

export function OwnerBookingsClient({ initialBookings, userId }: OwnerBookingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const todayDate = getTodayDateKey();
  const urlDate = searchParams.get(DATE_FILTER_PARAM);
  const activeDate = isValidDateFilter(urlDate) ? urlDate : todayDate;
  const isToday = activeDate === todayDate;

  const [bookings, setBookings] = useState<any[]>(() => {
    if (!initialBookings) return [];
    if (!Array.isArray(initialBookings)) return [];
    return initialBookings;
  });
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidDateFilter(urlDate)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set(DATE_FILTER_PARAM, todayDate);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [urlDate, pathname, router, searchParams, todayDate]);

  useEffect(() => {
    let cancelled = false;

    const syncCompletedBookings = async () => {
      await autoCompleteOwnerBookings(userId);
      if (cancelled) return;

      setBookings((prev) =>
        prev.map((booking) =>
          isBookingEffectivelyCompleted(booking) && booking.status !== 'completed'
            ? { ...booking, status: 'completed' }
            : booking
        )
      );
    };

    syncCompletedBookings();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filteredBookings = useMemo(
    () =>
      sortBookingsForOwnerDisplay(
        bookings.filter((booking) => matchesBookingDate(booking.booking_date, activeDate))
      ),
    [bookings, activeDate]
  );

  const completedBookings = useMemo(
    () => filteredBookings.filter((booking) => countsTowardRevenue(booking)),
    [filteredBookings]
  );

  const totalRevenue = useMemo(
    () => completedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0),
    [completedBookings]
  );

  const updateDateFilter = (date: string) => {
    if (!isValidDateFilter(date)) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set(DATE_FILTER_PARAM, date);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500 text-white',
      confirmed: 'bg-green-500 text-white',
      cancelled: 'bg-red-500 text-white',
      completed: 'bg-blue-500 text-white',
      expired: 'bg-gray-500 text-white',
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

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="owner" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
            <p className="text-muted-foreground mt-1">
              {isToday
                ? "Today's bookings"
                : `Bookings for ${formatFilterDateLabel(activeDate)}`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="relative p-6">
              <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="pr-12">
                <p className="text-sm text-muted-foreground">
                  {isToday ? "Today's bookings" : "Bookings on date"}
                </p>
                <h3 className="mt-2 text-3xl font-bold leading-none">{filteredBookings.length}</h3>
              </div>
            </Card>
            <Card className="relative p-6">
              <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="pr-12">
                <p className="text-sm text-muted-foreground">Pending</p>
                <h3 className="mt-2 text-3xl font-bold leading-none text-yellow-500">
                  {filteredBookings.filter((b) => getEffectiveBookingStatus(b) === 'pending').length}
                </h3>
              </div>
            </Card>
            <Card className="relative p-6">
              <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="pr-12">
                <p className="text-sm text-muted-foreground">Completed</p>
                <h3 className="mt-2 text-3xl font-bold leading-none text-blue-500">
                  {completedBookings.length}
                </h3>
              </div>
            </Card>
            <Card className="relative p-6">
              <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <div className="pr-12">
                <p className="text-sm text-muted-foreground">
                  {isToday ? "Today's revenue" : "Revenue on date"}
                </p>
                <h3 className="mt-2 text-2xl font-bold leading-none text-primary sm:text-3xl">
                  PKR {totalRevenue.toLocaleString()}
                </h3>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">Bookings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredBookings.length} booking{filteredBookings.length === 1 ? "" : "s"} for{" "}
                  {isToday ? "today" : formatFilterDateLabel(activeDate)}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start lg:w-auto">
                <OwnerBookingDateFilter value={activeDate} onChange={updateDateFilter} />
                {!isToday && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateDateFilter(todayDate)}
                    className="sm:mt-7"
                  >
                    Today
                  </Button>
                )}
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bookings on this date</h3>
                <p className="text-muted-foreground mb-4">
                  {isToday
                    ? "You have no bookings scheduled for today."
                    : `There are no bookings for ${formatFilterDateLabel(activeDate)}.`}
                </p>
                {!isToday && (
                  <Button type="button" variant="outline" onClick={() => updateDateFilter(todayDate)}>
                    Go to today
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const displayStatus = getEffectiveBookingStatus(booking);
                  const canDelete = canOwnerDeleteBooking(booking);

                  return (
                    <Card key={booking.id} className="p-4 border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div>
                              <h3 className="font-bold text-lg">{booking.venues?.name || 'Unknown Venue'}</h3>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <Badge className={getStatusBadge(displayStatus)}>
                                  {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                                </Badge>
                                <BookingDiscountBadge
                                  discountType={booking.discount_type}
                                  discountLabel={booking.discount_label}
                                />
                              </div>
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
                              <Banknote className="w-4 h-4" />
                              <div>
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <p className="font-bold text-foreground">
                                  PKR {booking.total_price?.toLocaleString() || 0}
                                </p>
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
                          {displayStatus === 'pending' && (
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
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeletingBookingId(booking.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          )}
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
