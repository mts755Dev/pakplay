import { format, parseISO } from 'date-fns';

type BookingWhatsAppMessageParams = {
  isOwnerBooking: boolean;
  venueName: string;
  bookingDate: string;
  startTimeLabel: string;
  endTimeLabel: string;
  totalHours: number;
  playerName: string;
  playerPhone: string;
  playerEmail: string;
  totalPrice: number;
  notes?: string | null;
};

function formatBookingDate(date: string): string {
  try {
    return format(parseISO(date), 'EEEE, d MMMM yyyy');
  } catch {
    return date;
  }
}

function formatDuration(hours: number): string {
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

function buildDetailsBlock(
  bookingDate: string,
  startTimeLabel: string,
  endTimeLabel: string,
  totalHours: number,
  totalPrice: number,
  notes?: string | null
): string {
  return (
    `📅 *Date:* ${formatBookingDate(bookingDate)}\n` +
    `⏰ *Time:* ${startTimeLabel} - ${endTimeLabel}\n` +
    `⏱️ *Duration:* ${formatDuration(totalHours)}\n\n` +
    `💰 *Total Amount:* PKR ${totalPrice.toLocaleString()}` +
    `${notes?.trim() ? `\n\n📝 *Notes:*\n${notes.trim()}` : ''}`
  );
}

const FOOTER = `\n\n━━━━━━━━━━━━━━━\n✨ *PakPlay*\n🌐 www.pakplay.co`;

export function buildBookingWhatsAppMessage({
  isOwnerBooking,
  venueName,
  bookingDate,
  startTimeLabel,
  endTimeLabel,
  totalHours,
  playerName,
  playerPhone,
  playerEmail,
  totalPrice,
  notes,
}: BookingWhatsAppMessageParams): string {
  const detailsBlock = buildDetailsBlock(
    bookingDate,
    startTimeLabel,
    endTimeLabel,
    totalHours,
    totalPrice,
    notes
  );

  if (isOwnerBooking) {
    return (
      `🎾 *Booking Confirmation* 🎾\n\n` +
      `Hi ${playerName},\n\n` +
      `Your booking at *${venueName}* has been confirmed.\n\n` +
      detailsBlock +
      FOOTER
    );
  }

  return (
    `🎾 *PakPlay Booking Request* 🎾\n\n` +
    `📍 *Venue:* ${venueName}\n` +
    detailsBlock +
    `\n\n👤 *Customer Details:*\n` +
    `Name: ${playerName}\n` +
    `Phone: ${playerPhone}\n` +
    `Email: ${playerEmail}` +
    FOOTER
  );
}

export function getBookingWhatsAppTarget(
  isOwnerBooking: boolean,
  playerPhone: string,
  venueWhatsAppNumber: string
): string {
  return isOwnerBooking ? playerPhone : venueWhatsAppNumber;
}
