import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type SpecialOffer = Tables<'special_offers'>;

interface SpecialOfferBadgeProps {
  offer: SpecialOffer;
  originalPrice: number;
  className?: string;
}

export const SpecialOfferBadge = ({ offer, originalPrice, className = "" }: SpecialOfferBadgeProps) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-blue-400/50 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-blue-600 text-white">
          🔥 SPECIAL OFFER
        </Badge>
        <Badge variant="outline" className="bg-white/20 text-white border-white/30">
          {offer.discount_percentage?.toFixed(0)}% OFF
        </Badge>
      </div>
      
      <p className="text-white/80 text-sm mb-2">Starting from</p>
      
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl font-bold text-white/60 line-through decoration-blue-500 decoration-2">
          PKR {originalPrice.toLocaleString()}
        </span>
        <span className="text-3xl font-bold text-white">
          PKR {offer.offer_price.toLocaleString()}<span className="text-lg font-normal">/hour</span>
        </span>
      </div>

      {offer.offer_name && (
        <p className="text-white/90 text-sm font-medium mb-1">
          {offer.offer_name}
        </p>
      )}
      
      {offer.description && (
        <p className="text-white/70 text-xs mb-2">
          {offer.description}
        </p>
      )}
      
      <div className="flex items-center gap-1 text-white/70 text-xs mt-2 pt-2 border-t border-white/20">
        <Calendar className="w-3 h-3" />
        <span>Valid until {formatDateTime(offer.valid_until)}</span>
      </div>
    </div>
  );
};

