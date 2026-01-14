# Google AdSense Setup Guide

## ✅ What's Been Done

Your PakPlay app is now ready for Google AdSense! Here's what has been set up:

### 1. **AdSense Script Added** ✅
- Added to `src/app/layout.tsx`
- Uses Next.js Script component with `afterInteractive` strategy for optimal performance
- Your Publisher ID: `ca-pub-6304905603815784`

### 2. **ads.txt File Created** ✅
- Location: `public/ads.txt`
- Contains your publisher verification
- Will be accessible at: `https://pakplay.co/ads.txt`

### 3. **Reusable Ad Components Created** ✅
- Location: `src/components/ads/AdSenseUnit.tsx`
- Pre-built components for different ad types

---

## 📋 Next Steps

### Step 1: Create Ad Units in Google AdSense

1. Go to [Google AdSense Dashboard](https://www.google.com/adsense/)
2. Navigate to **Ads** → **By ad unit** → **Display ads**
3. Create ad units for different placements:
   - **Banner Ad** (for top/bottom of pages)
   - **Sidebar Ad** (for sidebars)
   - **In-feed Ad** (between venue listings)
   - **Responsive Ad** (general purpose)

4. For each ad unit, Google will give you an **Ad Slot ID** (looks like: `1234567890`)
5. Save these Ad Slot IDs - you'll need them!

---

## 🎯 How to Display Ads on Your Pages

### Option 1: Using Pre-built Components

**Edit the file:** `src/components/ads/AdSenseUnit.tsx`

Replace the placeholder Ad Slot IDs with your real ones:
```typescript
// Find these lines and replace with your actual ad slot IDs
adSlot="REPLACE_WITH_YOUR_BANNER_AD_SLOT"      // Replace with your ID
adSlot="REPLACE_WITH_YOUR_SIDEBAR_AD_SLOT"     // Replace with your ID
adSlot="REPLACE_WITH_YOUR_INFEED_AD_SLOT"      // Replace with your ID
adSlot="REPLACE_WITH_YOUR_RESPONSIVE_AD_SLOT"  // Replace with your ID
```

Then use the components in your pages:
```typescript
import { BannerAd, SidebarAd, InFeedAd, ResponsiveAd } from "@/components/ads/AdSenseUnit";

// In your page component:
<BannerAd className="my-8" />
<SidebarAd className="sticky top-4" />
<InFeedAd className="my-4" />
<ResponsiveAd />
```

### Option 2: Custom Ad Placement

For custom ad placements, use the `AdSenseUnit` component directly:

```typescript
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";

<AdSenseUnit 
  adSlot="YOUR_AD_SLOT_ID"
  adFormat="auto"
  fullWidthResponsive={true}
  className="my-4"
/>
```

---

## 📍 Recommended Ad Placements

### **1. Home Page** (`src/app/page.tsx`)
- **Top Banner**: After hero section
- **In-feed Ad**: Between testimonials and features
- **Bottom Banner**: Before footer

### **2. Browse Venues** (`src/app/venues/page.tsx`)
- **Sidebar Ad**: Next to filters (desktop view)
- **In-feed Ads**: Every 6-8 venue cards
- **Top Banner**: Below the page header

### **3. Venue Detail Page** (`src/app/venue/[slug]/page.tsx`)
- **Sidebar Ad**: Next to booking section
- **Bottom Banner**: After reviews section

### **4. Offers Page** (`src/app/offers/page.tsx`)
- **In-feed Ads**: Between offer cards
- **Sidebar Ad**: Next to filters

---

## 💡 Best Practices

### ✅ Do's:
- Wait for Google approval before expecting ads to show (can take 24-48 hours)
- Place ads where they don't disrupt user experience
- Test on mobile and desktop devices
- Keep ads above the fold for better visibility
- Use responsive ad formats for automatic sizing

### ❌ Don'ts:
- Don't place more than 3 ads per page (unless you have lots of content)
- Don't click on your own ads (violates AdSense policy!)
- Don't place ads too close together
- Don't hide ads or make them hard to see
- Don't place ads on pages with little/no content

---

## 🚀 Example: Adding Ads to Venues Page

**File:** `src/components/pages/VenuesPageClient.tsx`

```typescript
import { InFeedAd, SidebarAd } from "@/components/ads/AdSenseUnit";

// Inside your component:
<div className="grid md:grid-cols-4 gap-6">
  {/* Sidebar with ad */}
  <div className="md:col-span-1">
    {/* Your filters */}
    <VenueFilters />
    
    {/* Add sidebar ad below filters */}
    <SidebarAd className="mt-6 sticky top-4" />
  </div>
  
  {/* Main content */}
  <div className="md:col-span-3">
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {venues.map((venue, index) => (
        <>
          <VenueCard key={venue.id} venue={venue} />
          
          {/* Show ad after every 6 venues */}
          {(index + 1) % 6 === 0 && (
            <div className="col-span-full">
              <InFeedAd className="my-4" />
            </div>
          )}
        </>
      ))}
    </div>
  </div>
</div>
```

---

## 🔍 Verification & Testing

### Verify ads.txt:
1. Deploy your app to production
2. Visit: `https://pakplay.co/ads.txt`
3. You should see: `google.com, pub-6304905603815784, DIRECT, f08c47fec0942fa0`

### Check AdSense Installation:
1. Open browser DevTools (F12)
2. Go to Console
3. Look for no AdSense errors
4. In Network tab, check if `adsbygoogle.js` loaded successfully

### Why aren't ads showing?
- **Site not approved yet**: Wait for Google approval (24-48 hours)
- **Ad slot IDs not set**: Replace placeholder IDs with real ones
- **AdBlocker enabled**: Disable ad blockers for testing
- **Development mode**: Ads may not show on localhost
- **New site**: Google needs to crawl your site first

---

## 📊 Monitoring Performance

Once ads are showing:
1. Check AdSense dashboard daily
2. Monitor which pages perform best
3. Experiment with ad placements
4. Track user feedback
5. Optimize for both revenue and user experience

---

## 🆘 Need Help?

- [Google AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Community Forum](https://support.google.com/adsense/community)
- [AdSense Policies](https://support.google.com/adsense/answer/48182)

---

## 📝 Quick Reference

**Your Publisher ID:** `ca-pub-6304905603815784`

**Files Modified:**
- ✅ `src/app/layout.tsx` - AdSense script added
- ✅ `public/ads.txt` - Verification file
- ✅ `src/components/ads/AdSenseUnit.tsx` - Ad components

**Next Action:** 
→ Go to AdSense dashboard and create your ad units
→ Replace placeholder Ad Slot IDs in `AdSenseUnit.tsx`
→ Add ad components to your pages
→ Deploy and wait for approval!

---

Good luck with your AdSense monetization! 🎉
