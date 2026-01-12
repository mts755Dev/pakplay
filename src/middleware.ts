import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  
  // Create response
  const response = NextResponse.next();
  
  // Extract project ref from Supabase URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const cookieName = `sb-${projectRef}-auth-token`;
  
  // Get auth token from cookies
  const authCookie = request.cookies.get(cookieName);
  
  // Create Supabase client that reads from cookies
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      storage: {
        getItem: (key: string) => {
          const cookie = request.cookies.get(key);
          return cookie?.value || null;
        },
        setItem: () => {},
        removeItem: () => {},
      },
    },
  });
  
  // Check if we're on a custom subdomain
  const isSubdomain = isCustomSubdomain(hostname);
  
  if (isSubdomain && url.pathname === '/') {
    // Extract subdomain
    const subdomain = hostname.split('.')[0];
    
    // Try to fetch venue by subdomain
    const { data: venue } = await supabase
      .from('venues')
      .select('slug')
      .eq('custom_subdomain', subdomain)
      .eq('status', 'approved')
      .single();
    
    if (venue) {
      // Rewrite to the venue detail page while keeping the clean URL
      return NextResponse.rewrite(new URL(`/venue/${venue.slug}`, request.url));
    }
  }
  
  // Note: Auth checks are handled by the page components themselves
  // This allows for better client-side session management
  
  return response;
}

function isCustomSubdomain(hostname: string): boolean {
  // Split hostname into parts
  const parts = hostname.split('.');
  
  // Local development
  if (hostname.includes('localhost') || hostname.startsWith('127.0.0.1')) {
    return false;
  }
  
  // Main domain (pakplay.co or www.pakplay.co)
  if (parts.length < 3 || parts[0] === 'www' || hostname === process.env.NEXT_PUBLIC_DOMAIN) {
    return false;
  }
  
  // It's a subdomain!
  return true;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Only run middleware on:
     * - Root path (for subdomain checking)
     * - Exclude: API routes, static files, dashboard pages (they handle auth themselves)
     */
    '/',
    '/venue/:path*',
  ],
};

