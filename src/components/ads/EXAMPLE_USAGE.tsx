/**
 * EXAMPLE: How to Add Google AdSense to Your Pages
 * 
 * This file shows practical examples of adding ads to different pages.
 * Copy these examples and adapt them to your needs.
 */

import { AdSenseUnit, BannerAd, SidebarAd, InFeedAd, ResponsiveAd } from "./AdSenseUnit";

// ==================== EXAMPLE 1: Home Page ====================
// File: src/app/page.tsx or src/components/pages/IndexPage.tsx

export function HomePageWithAds() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to PakPlay</h1>
        {/* Hero content */}
      </section>

      {/* Banner Ad after Hero */}
      <div className="container mx-auto px-4 my-8">
        <BannerAd className="max-w-4xl mx-auto" />
      </div>

      {/* Features Section */}
      <section className="features">
        {/* Features content */}
      </section>

      {/* In-feed Ad between sections */}
      <div className="container mx-auto px-4 my-8">
        <InFeedAd />
      </div>

      {/* Testimonials */}
      <section className="testimonials">
        {/* Testimonials content */}
      </section>

      {/* Bottom Banner before Footer */}
      <div className="container mx-auto px-4 my-8">
        <ResponsiveAd />
      </div>
    </div>
  );
}

// ==================== EXAMPLE 2: Venues List Page ====================
// File: src/components/pages/VenuesPageClient.tsx

export function VenuesPageWithAds() {
  const venues = []; // Your venues data

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Top Banner */}
      <BannerAd className="mb-8" />

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar with Filters */}
        <aside className="md:col-span-1">
          <div className="bg-card rounded-lg p-4">
            {/* Your filters here */}
            <h3>Filters</h3>
            {/* Filter components */}
          </div>

          {/* Sidebar Ad (sticky) */}
          <div className="mt-6 hidden md:block">
            <SidebarAd className="sticky top-4" />
          </div>
        </aside>

        {/* Venues Grid */}
        <div className="md:col-span-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue, index) => (
              <div key={venue.id}>
                {/* Venue Card */}
                <div className="venue-card">
                  {/* Venue content */}
                </div>

                {/* Show In-feed Ad after every 6 venues */}
                {(index + 1) % 6 === 0 && index !== venues.length - 1 && (
                  <div className="col-span-full my-4">
                    <InFeedAd />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== EXAMPLE 3: Venue Detail Page ====================
// File: src/components/pages/VenueDetailClient.tsx

export function VenueDetailWithAds() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Venue Images */}
          <section className="venue-images mb-6">
            {/* Image gallery */}
          </section>

          {/* Venue Info */}
          <section className="venue-info mb-6">
            <h1>Venue Name</h1>
            {/* Venue details */}
          </section>

          {/* In-feed Ad */}
          <div className="my-8">
            <InFeedAd />
          </div>

          {/* Amenities */}
          <section className="amenities mb-6">
            {/* Amenities list */}
          </section>

          {/* Reviews */}
          <section className="reviews">
            {/* Reviews list */}
          </section>

          {/* Another In-feed Ad after reviews */}
          <div className="my-8">
            <InFeedAd />
          </div>
        </div>

        {/* Sidebar with Booking */}
        <aside className="md:col-span-1">
          {/* Booking Card */}
          <div className="sticky top-4 space-y-6">
            <div className="bg-card rounded-lg p-6">
              {/* Booking form */}
              <h3>Book Now</h3>
              {/* Booking details */}
            </div>

            {/* Sidebar Ad below booking */}
            <SidebarAd />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ==================== EXAMPLE 4: Custom Ad with Specific Slot ====================
// Use this when you need more control

export function CustomAdPlacement() {
  return (
    <div className="my-8">
      <AdSenseUnit
        adSlot="1234567890" // Replace with your actual ad slot ID
        adFormat="auto"
        fullWidthResponsive={true}
        className="max-w-3xl mx-auto"
        style={{ minHeight: "250px" }}
      />
    </div>
  );
}

// ==================== EXAMPLE 5: Conditional Ad Display ====================
// Show ads only on certain conditions

export function ConditionalAd({ showAd = true }: { showAd?: boolean }) {
  if (!showAd) return null;

  return (
    <div className="my-6">
      <ResponsiveAd />
    </div>
  );
}

// ==================== EXAMPLE 6: Mobile vs Desktop Ads ====================
// Different ads for different screen sizes

export function ResponsiveAdPlacement() {
  return (
    <>
      {/* Desktop Ad */}
      <div className="hidden md:block">
        <BannerAd className="my-8" />
      </div>

      {/* Mobile Ad */}
      <div className="block md:hidden">
        <ResponsiveAd className="my-4" />
      </div>
    </>
  );
}

// ==================== QUICK START ====================
/*

To add ads to your pages:

1. Import the ad component:
   import { BannerAd, SidebarAd, InFeedAd } from "@/components/ads/AdSenseUnit";

2. Add to your page:
   <BannerAd className="my-8" />

3. Remember to:
   - Replace placeholder ad slot IDs in AdSenseUnit.tsx
   - Wait for Google AdSense approval
   - Test on mobile and desktop
   - Monitor performance in AdSense dashboard

*/
