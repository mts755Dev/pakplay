// Supabase client for Next.js
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// For client-side usage - uses cookies for SSR compatibility
// Lazy initialization to avoid crashes if env vars are missing
let _supabase: ReturnType<typeof createBrowserClient<Database>> | null = null;

function getSupabaseClient() {
  if (_supabase) return _supabase;
  
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.');
    // Return a proxy that throws helpful errors when methods are called
    return new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
      get: () => {
        throw new Error('Supabase client not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
      }
    });
  }
  
  _supabase = createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
  
  return _supabase;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get: (_, prop) => {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});