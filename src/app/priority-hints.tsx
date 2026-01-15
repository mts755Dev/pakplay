/**
 * Priority Hints Component
 * Uses fetchpriority to optimize resource loading order
 */

export function PriorityHints() {
  return (
    <>
      {/* Preload critical resources with high priority */}
      <link
        rel="preload"
        href="https://gyofcafqzukjyxourkpn.supabase.co/storage/v1/object/public"
        as="fetch"
        crossOrigin="anonymous"
      />
      
      {/* Preload Google Places images with high priority */}
      <link
        rel="preload"
        href="https://lh3.googleusercontent.com"
        as="fetch"
        crossOrigin="anonymous"
      />
    </>
  );
}
