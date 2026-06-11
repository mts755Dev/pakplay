import {
  bookingToInterval,
  getCourtAvailability,
  parseTimeToMinutes,
  type TimeInterval,
} from './court-availability';

export type HourlySlot = {
  hour: number;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
  availableCourts: number;
  totalCourts: number;
  isPast: boolean;
  isBooked: boolean;
};

export function hourToTimeString(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function slotEndTimeString(startHour: number): string {
  return startHour === 23 ? '00:00' : hourToTimeString(startHour + 1);
}

/** Compact single-line label e.g. "9-10p", "11a-12p", "12-1a" */
export function formatHourlySlotLabel(startHour: number): string {
  const endHour = (startHour + 1) % 24;
  const hour12 = (h: number) => h % 12 || 12;
  const period = (h: number) => (h < 12 ? 'a' : 'p');

  const start = hour12(startHour);
  const end = hour12(endHour);
  const startPeriod = period(startHour);
  const endPeriod = period(endHour);

  if (startPeriod === endPeriod) {
    return `${start}-${end}${endPeriod}`;
  }

  return `${start}${startPeriod}-${end}${endPeriod}`;
}

export function getSelectedStartHour(startTime: string): number | null {
  if (!startTime) return null;
  return parseInt(startTime.split(':')[0], 10);
}

export function getSelectedEndHour(startTime: string, endTime: string): number | null {
  if (!startTime || !endTime) return null;

  const startMinutes = parseTimeToMinutes(startTime);
  let endMinutes = parseTimeToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return Math.floor(endMinutes / 60) - 1;
}

export function isSlotInSelectedRange(
  hour: number,
  startTime: string,
  endTime: string
): boolean {
  const startHour = getSelectedStartHour(startTime);
  const endHour = getSelectedEndHour(startTime, endTime);
  if (startHour === null || endHour === null) return false;
  return hour >= startHour && hour <= endHour;
}

export function isSlotPast(
  bookingDate: string,
  hour: number,
  isOwner: boolean
): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (bookingDate < today) return true;
  if (bookingDate > today) return false;

  const slotStart = new Date(`${bookingDate}T${hourToTimeString(hour)}`);
  const now = new Date();

  if (isOwner) {
    return slotStart < now;
  }

  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  return slotStart < oneHourFromNow;
}

export function buildHourlySlots(
  totalCourts: number,
  bookingIntervals: TimeInterval[],
  bookingDate: string,
  isOwner: boolean
): HourlySlot[] {
  const slots: HourlySlot[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const startTime = hourToTimeString(hour);
    const endTime = slotEndTimeString(hour);
    const availability = getCourtAvailability(
      totalCourts,
      bookingIntervals,
      startTime,
      endTime
    );
    const isPast = bookingDate ? isSlotPast(bookingDate, hour, isOwner) : false;

    slots.push({
      hour,
      label: formatHourlySlotLabel(hour),
      startTime,
      endTime,
      available: availability.available && !isPast,
      availableCourts: availability.availableCourts,
      totalCourts: availability.totalCourts,
      isPast,
      isBooked: !availability.available && !isPast,
    });
  }

  return slots;
}

export function isRangeAvailable(
  slots: HourlySlot[],
  startHour: number,
  endHour: number
): boolean {
  for (let hour = startHour; hour <= endHour; hour++) {
    const slot = slots[hour];
    if (!slot || !slot.available) return false;
  }
  return true;
}

export function bookingIntervalsFromDayBookings(
  dayBookings: Array<{ start_time: string; end_time: string }>
): TimeInterval[] {
  return dayBookings.map((booking) =>
    bookingToInterval(booking.start_time, booking.end_time)
  );
}
