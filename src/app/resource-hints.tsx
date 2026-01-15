/**
 * Resource Hints Component
 * Optimizes network requests by establishing early connections
 */

export function ResourceHints() {
  return (
    <>
      {/* DNS Prefetch - Early DNS resolution */}
      <link rel="dns-prefetch" href="https://gyofcafqzukjyxourkpn.supabase.co" />
      <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
      <link rel="dns-prefetch" href="https://lh5.googleusercontent.com" />
      <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      
      {/* Preconnect - Establish early connections (DNS + TCP + TLS) */}
      <link 
        rel="preconnect" 
        href="https://gyofcafqzukjyxourkpn.supabase.co" 
        crossOrigin="anonymous" 
      />
      <link 
        rel="preconnect" 
        href="https://lh3.googleusercontent.com" 
        crossOrigin="anonymous" 
      />
      <link 
        rel="preconnect" 
        href="https://pagead2.googlesyndication.com" 
        crossOrigin="anonymous" 
      />
    </>
  );
}
