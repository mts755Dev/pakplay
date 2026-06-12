import { format, isValid, parseISO } from 'date-fns';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type EffectiveBookingStatus = BookingStatus | 'expired';

type BookingTimeFields = {
  status: string;
  booking_date: string;
  start_time: string;
  end_time: string;
};

export function normalizeBookingDateKey(date: string): string {
  if (!date) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parsed = parseISO(date);
  if (isValid(parsed)) {
    return format(parsed, 'yyyy-MM-dd');
  }

  return date.includes('T') ? date.split('T')[0] : date;
}

export function matchesBookingDate(bookingDate: string, filterDate: string): boolean {
  return normalizeBookingDateKey(bookingDate) === filterDate;
}

function parseBookingDateTime(date: string, time: string): Date | null {
  try {
    const datePart = normalizeBookingDateKey(date);
    const timePart = time.split('.')[0];
    const [hours = '00', minutes = '00', seconds = '00'] = timePart.split(':');

    const bookingDateTime = new Date(
      `${datePart}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
    );

    return Number.isNaN(bookingDateTime.getTime()) ? null : bookingDateTime;
  } catch {
    return null;
  }
}

export function isBookingStartTimePassed(bookingDate: string, startTime: string): boolean {
  const bookingDateTime = parseBookingDateTime(bookingDate, startTime);
  if (!bookingDateTime) return false;
  return bookingDateTime < new Date();
}

export function isBookingEndTimePassed(bookingDate: string, endTime: string): boolean {
  const bookingDateTime = parseBookingDateTime(bookingDate, endTime);
  if (!bookingDateTime) return false;
  return bookingDateTime < new Date();
}

export function isBookingEffectivelyCompleted(booking: BookingTimeFields): boolean {
  if (booking.status === 'completed') return true;
  return booking.status === 'confirmed' && isBookingEndTimePassed(booking.booking_date, booking.end_time);
}

export function getEffectiveBookingStatus(booking: BookingTimeFields): EffectiveBookingStatus {
  if (booking.status === 'pending' && isBookingStartTimePassed(booking.booking_date, booking.start_time)) {
    return 'expired';
  }

  if (isBookingEffectivelyCompleted(booking)) {
    return 'completed';
  }

  return booking.status as BookingStatus;
}

export function countsTowardRevenue(booking: BookingTimeFields): boolean {
  return isBookingEffectivelyCompleted(booking);
}

export function canOwnerDeleteBooking(booking: BookingTimeFields): boolean {
  return !isBookingEffectivelyCompleted(booking);
}

const OWNER_BOOKING_STATUS_PRIORITY: Record<EffectiveBookingStatus, number> = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: 3,
  expired: 4,
};

export function sortBookingsForOwnerDisplay<T extends BookingTimeFields>(bookings: T[]): T[] {
  return [...bookings].sort((a, b) => {
    const statusA = getEffectiveBookingStatus(a);
    const statusB = getEffectiveBookingStatus(b);
    const statusDiff = OWNER_BOOKING_STATUS_PRIORITY[statusA] - OWNER_BOOKING_STATUS_PRIORITY[statusB];

    if (statusDiff !== 0) return statusDiff;

    return (a.start_time || '').localeCompare(b.start_time || '');
  });
}
