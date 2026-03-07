import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables for public client.');
}

// This client is for public data fetching ONLY.
// It does NOT use the user's session, ensuring requests behave exactly like a non-logged-in user.
// This prevents any RLS or auth-related issues for public data like Venues and Offers.
export const publicSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

/**
 * Create an authenticated Supabase client that carries the user's JWT
 * but does NOT auto-refresh tokens (which causes hanging).
 * Pass the accessToken from useAuth().accessToken.
 * Falls back to publicSupabase if no token is provided.
 */
export function getAuthClient(accessToken: string | null) {
  if (accessToken) {
    return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }
  return publicSupabase;
}
