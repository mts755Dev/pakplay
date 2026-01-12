import { useEffect, useState } from "react";

interface AdSlotProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
}

// Configuration - Set this to your AdSense client ID
const ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXX";
const ADS_ENABLED = ADSENSE_CLIENT_ID !== "ca-pub-XXXXXXXXXX"; // Automatically detects if configured

export const AdSlot = ({ 
  slot, 
  format = "auto", 
  responsive = true,
  className = ""
}: AdSlotProps) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Only load ads if properly configured
    if (!ADS_ENABLED) {
      return;
    }

    try {
      // @ts-ignore
      if (window.adsbygoogle && window.adsbygoogle.length === 0) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (error) {
      console.error("Ad loading error:", error);
    }
  }, []);

  // Don't render anything if ads are not configured
  if (!ADS_ENABLED) {
    return null;
  }

  return (
    <div className={`ad-slot ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};

// Pre-configured ad sizes for different placements
export const AdBanner = ({ className = "" }: { className?: string }) => {
  // Don't render if ads not configured
  if (!ADS_ENABLED) return null;
  
  return (
    <div className={`my-8 ${className}`}>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-xs text-gray-400 mb-2">Advertisement</p>
        <AdSlot slot="1234567890" format="horizontal" className="min-h-[90px]" />
      </div>
    </div>
  );
};

export const AdRectangle = ({ className = "" }: { className?: string }) => {
  // Don't render if ads not configured
  if (!ADS_ENABLED) return null;
  
  return (
    <div className={`${className}`}>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-xs text-gray-400 mb-2">Advertisement</p>
        <AdSlot slot="0987654321" format="rectangle" className="min-h-[250px]" />
      </div>
    </div>
  );
};

export const AdNative = ({ className = "" }: { className?: string }) => {
  // Don't render if ads not configured
  if (!ADS_ENABLED) return null;
  
  return (
    <div className={`my-6 ${className}`}>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
        <p className="text-xs text-gray-400 mb-3">Sponsored</p>
        <AdSlot slot="1357924680" format="fluid" responsive={true} className="min-h-[200px]" />
      </div>
    </div>
  );
};

