"use client";

import { useEffect } from "react";

interface AdSenseUnitProps {
  adSlot: string;
  adFormat?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Google AdSense Ad Unit Component
 * 
 * Usage:
 * <AdSenseUnit 
 *   adSlot="YOUR_AD_SLOT_ID"
 *   adFormat="auto"
 *   fullWidthResponsive={true}
 * />
 * 
 * Note: Replace "YOUR_AD_SLOT_ID" with your actual ad slot ID from AdSense dashboard
 */
export function AdSenseUnit({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  style,
  className = "",
}: AdSenseUnitProps) {
  useEffect(() => {
    try {
      // Push ad to adsbygoogle array for rendering
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client="ca-pub-6304905603815784"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}

/**
 * Predefined Ad Units for common placements
 */

// Banner Ad (Top/Bottom of page)
export function BannerAd({ className }: { className?: string }) {
  return (
    <AdSenseUnit
      adSlot="REPLACE_WITH_YOUR_BANNER_AD_SLOT"
      adFormat="horizontal"
      className={className}
    />
  );
}

// Sidebar Ad
export function SidebarAd({ className }: { className?: string }) {
  return (
    <AdSenseUnit
      adSlot="REPLACE_WITH_YOUR_SIDEBAR_AD_SLOT"
      adFormat="vertical"
      className={className}
    />
  );
}

// In-feed Ad (Between content)
export function InFeedAd({ className }: { className?: string }) {
  return (
    <AdSenseUnit
      adSlot="REPLACE_WITH_YOUR_INFEED_AD_SLOT"
      adFormat="fluid"
      className={className}
    />
  );
}

// Responsive Auto Ad
export function ResponsiveAd({ className }: { className?: string }) {
  return (
    <AdSenseUnit
      adSlot="REPLACE_WITH_YOUR_RESPONSIVE_AD_SLOT"
      adFormat="auto"
      fullWidthResponsive={true}
      className={className}
    />
  );
}
