import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || '';
    const url = request.nextUrl;
    
    // Create response
    const response = NextResponse.next();
    
    // Add Early Hints for critical resources (HTTP 103 Early Hints)
    response.headers.set(
      'Link',
      '<https://gyofcafqzukjyxourkpn.supabase.co>; rel=preconnect; crossorigin, ' +
      '<https://lh3.googleusercontent.com>; rel=preconnect; crossorigin, ' +
      '<https://pagead2.googlesyndication.com>; rel=preconnect; crossorigin'
    );
    
    // Enable DNS prefetch
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    
    // Check environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not configured in middleware');
      return response;
    }
    
    // Extract project ref from Supabase URL
    const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
      return response;
    }
    
    // Check if we're on a custom subdomain
    const isSubdomain = isCustomSubdomain(hostname);
    
    if (isSubdomain && url.pathname === '/') {
      // Extract subdomain
      const subdomain = hostname.split('.')[0];
      
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
      
      // Try to fetch venue by subdomain
      const { data: venue, error } = await supabase
        .from('venues')
        .select('slug')
        .eq('subdomain', subdomain)
        .eq('status', 'approved')
        .single();
      
      if (error) {
        console.error('Error fetching venue in middleware:', error);
      }
      
      if (venue) {
        // Rewrite to the venue detail page while keeping the clean URL
        return NextResponse.rewrite(new URL(`/venue/${venue.slug}`, request.url));
      }
    }
    
    // Note: Auth checks are handled by the page components themselves
    // This allows for better client-side session management
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Return next response on any error to avoid breaking the site
    return NextResponse.next();
  }
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
