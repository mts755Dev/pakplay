// Server-side authentication utilities
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/integrations/supabase/types';
import { cache } from 'react';

/**
 * Create a Supabase client for server components
 */
function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components / server actions may not set cookies
          }
        },
      },
    }
  );
}

/**
 * Get the current user session on the server
 * Returns null if not authenticated
 */
export async function getServerUser() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

/**
 * Get user with their role (OPTIMIZED with React Cache)
 * React cache() deduplicates calls within the same request
 */
export const getServerUserWithRole = cache(async () => {
  try {
    const supabase = createClient();
    
    // Get user session (uses cached session from cookies - fast!)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }
    
    // Fetch profile with role (only one additional query)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle to avoid error if profile doesn't exist
    
    return { user, role: profile?.role || null };
  } catch (error) {
    console.error('Error getting server user with role:', error);
    return null;
  }
});

