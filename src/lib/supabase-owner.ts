import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/integrations/supabase/types';

/**
 * Supabase client for owner dashboard mutations.
 * Uses service role when available; otherwise uses the logged-in user's session
 * from cookies so RLS policies apply correctly.
 */
export async function getOwnerActionSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    return createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  const cookieStore = cookies();
  return createServerClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components may not set cookies
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Server Components may not set cookies
          }
        },
      },
    }
  );
}
