export type TimeInterval = {
  startMinutes: number;
  endMinutes: number;
};

export type CourtAvailabilityResult = {
  available: boolean;
  availableCourts: number;
  bookedCourts: number;
  totalCourts: number;
};

/** Parse "HH:MM" or "HH:MM:SS" to minutes from midnight. */
export function parseTimeToMinutes(time: string): number {
  const [hoursPart, minutesPart] = time.split(':');
  const hours = parseInt(hoursPart, 10);
  const minutes = parseInt(minutesPart || '0', 10);
  return hours * 60 + minutes;
}

/** Convert booking times to a minute interval, handling overnight end times. */
export function bookingToInterval(startTime: string, endTime: string): TimeInterval {
  const startMinutes = parseTimeToMinutes(startTime);
  let endMinutes = parseTimeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return { startMinutes, endMinutes };
}

/**
 * Maximum concurrent bookings overlapping [rangeStart, rangeEnd).
 * Uses a sweep-line over clipped booking intervals.
 */
export function maxConcurrentBookings(
  bookings: TimeInterval[],
  rangeStart: number,
  rangeEnd: number
): number {
  const events: Array<{ time: number; delta: number }> = [];

  for (const booking of bookings) {
    if (booking.endMinutes <= rangeStart || booking.startMinutes >= rangeEnd) {
      continue;
    }

    const start = Math.max(booking.startMinutes, rangeStart);
    const end = Math.min(booking.endMinutes, rangeEnd);

    if (start >= end) continue;

    events.push({ time: start, delta: 1 });
    events.push({ time: end, delta: -1 });
  }

  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.delta - b.delta;
  });

  let current = 0;
  let max = 0;

  for (const event of events) {
    current += event.delta;
    max = Math.max(max, current);
  }

  return max;
}

/** Courts free for the entire requested slot (not just a single moment). */
export function getCourtAvailability(
  numberOfCourts: number,
  bookings: TimeInterval[],
  startTime: string,
  endTime: string
): CourtAvailabilityResult {
  const totalCourts = Math.max(1, numberOfCourts);
  const { startMinutes, endMinutes } = bookingToInterval(startTime, endTime);
  const bookedCourts = maxConcurrentBookings(bookings, startMinutes, endMinutes);
  const availableCourts = Math.max(0, totalCourts - bookedCourts);

  return {
    available: bookedCourts < totalCourts,
    availableCourts,
    bookedCourts,
    totalCourts,
  };
}
