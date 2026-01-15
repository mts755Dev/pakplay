import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ResourceHints } from "./resource-hints";
import { PriorityHints } from "./priority-hints";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "PakPlay - Where Pakistan Plays | #1 Sports Venue Booking Platform",
  description:
    "Book top-quality sports venues across Pakistan. Find and reserve cricket, football, futsal, pickleball, badminton & padel courts. Instant WhatsApp booking, real reviews, and best prices.",
  keywords: [
    "sports venue booking Pakistan",
    "book sports courts",
    "cricket pitch rental",
    "football ground booking",
    "futsal court booking",
    "pickleball court Pakistan",
    "badminton court booking",
    "padel court Pakistan",
    "sports facilities",
    "venue booking app",
  ],
  authors: [{ name: "PakPlay" }],
  creator: "PakPlay",
  publisher: "PakPlay",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://pakplay.co",
    title: "PakPlay - Where Pakistan Plays",
    description:
      "Pakistan's leading sports venue booking platform. Book quality venues instantly.",
    siteName: "PakPlay",
  },
  twitter: {
    card: "summary_large_image",
    title: "PakPlay - Where Pakistan Plays",
    description:
      "Pakistan's leading sports venue booking platform. Book quality venues instantly.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Organization structured data for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PakPlay",
    "alternateName": "PakPlay - Where Pakistan Plays",
    "url": "https://pakplay.co",
    "logo": "https://pakplay.co/pp%20logo.png",
    "description": "Pakistan's leading sports venue booking platform. Book quality sports facilities instantly - football grounds, cricket pitches, badminton courts, and more.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PK"
    },
    "sameAs": [
      "https://facebook.com/pakplay",
      "https://instagram.com/pakplay"
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline Critical CSS for immediate rendering */}
        <style dangerouslySetInnerHTML={{ __html: `
          *,::before,::after{box-sizing:border-box;border:0 solid #e5e7eb}
          html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
          body{margin:0;line-height:inherit;background-color:hsl(0 0% 97.3%);color:hsl(0 0% 13%);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
          img{max-width:100%;height:auto}button{font:inherit;cursor:pointer}a{color:inherit;text-decoration:inherit}
        ` }} />
        
        {/* Resource Hints - DNS Prefetch & Preconnect */}
        <ResourceHints />
        
        {/* Priority Hints - Preload critical resources */}
        <PriorityHints />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-sans antialiased">
        {/* Service Worker Registration */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
        
        {/* Google AdSense - Load after page interactive */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6304905603815784"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        
        <Providers>
          <ScrollToTop />
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}

