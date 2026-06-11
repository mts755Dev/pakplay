export type PlayerProfileRow = {
  full_name: string | null;
  phone: string | null;
  whatsapp_number?: string | null;
};

export type AuthUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

export type PlayerBookingDetails = {
  fullName: string | null;
  phone: string | null;
  email: string | null;
};

function metadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function getCachedPlayerBookingDetails(): Partial<PlayerBookingDetails> {
  if (typeof window === 'undefined') return {};

  return {
    fullName: localStorage.getItem('user_full_name'),
    phone: localStorage.getItem('user_phone'),
    email: localStorage.getItem('user_email'),
  };
}

export function cachePlayerBookingDetails(details: Partial<PlayerBookingDetails>) {
  if (typeof window === 'undefined') return;

  if (details.fullName) localStorage.setItem('user_full_name', details.fullName);
  if (details.phone) localStorage.setItem('user_phone', details.phone);
  if (details.email) localStorage.setItem('user_email', details.email);
}

export function resolvePlayerBookingDetails(
  profile: PlayerProfileRow | null | undefined,
  user: AuthUserLike | null | undefined
): PlayerBookingDetails {
  const metadata = user?.user_metadata ?? {};

  return {
    fullName:
      profile?.full_name?.trim() ||
      metadataString(metadata, 'full_name') ||
      metadataString(metadata, 'name') ||
      null,
    phone:
      profile?.phone?.trim() ||
      profile?.whatsapp_number?.trim() ||
      metadataString(metadata, 'phone') ||
      null,
    email: user?.email ?? null,
  };
}
