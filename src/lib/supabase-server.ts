import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Lazy initialization to avoid build-time errors
let _supabaseServer: SupabaseClient<Database> | null = null;

function getSupabaseServer(): SupabaseClient<Database> {
  if (_supabaseServer) return _supabaseServer;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  
  _supabaseServer = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  
  return _supabaseServer;
}

// Server-side Supabase client for data fetching (lazy-loaded)
export const supabaseServer = new Proxy({} as SupabaseClient<Database>, {
  get: (_, prop) => {
    const client = getSupabaseServer();
    return (client as any)[prop];
  }
});





