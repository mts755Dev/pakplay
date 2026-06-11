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
  const detailsBlock =
    `📅 *Date:* ${bookingDate}\n` +
    `⏰ *Time:* ${startTimeLabel} - ${endTimeLabel}\n` +
    `⏱️ *Duration:* ${totalHours} hour(s)\n\n` +
    `💰 *Total Amount:* PKR ${totalPrice.toLocaleString()}` +
    `${notes ? `\n\n📝 *Notes:*\n${notes}` : ''}`;

  const footer = `\n\n━━━━━━━━━━━━━━━\n✨ *PakPlay*\n🌐 www.pakplay.co`;

  if (isOwnerBooking) {
    return (
      `🎾 *Booking Confirmation* 🎾\n\n` +
      `Hi ${playerName},\n\n` +
      `Your booking at *${venueName}* has been registered.\n\n` +
      detailsBlock +
      footer
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
    footer
  );
}

export function getBookingWhatsAppTarget(
  isOwnerBooking: boolean,
  playerPhone: string,
  venueWhatsAppNumber: string
): string {
  return isOwnerBooking ? playerPhone : venueWhatsAppNumber;
}
