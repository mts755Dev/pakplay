import { Badge } from "@/components/ui/badge";
import { Sparkles, Tag } from "lucide-react";

export type BookingDiscountType = "offer" | "loyalty";

type BookingDiscountBadgeProps = {
  discountType?: string | null;
  discountLabel?: string | null;
  className?: string;
};

export function BookingDiscountBadge({
  discountType,
  discountLabel,
  className = "",
}: BookingDiscountBadgeProps) {
  if (discountType !== "offer" && discountType !== "loyalty") {
    return null;
  }

  const isOffer = discountType === "offer";
  const label = discountLabel?.trim() || (isOffer ? "Special Offer" : "Loyalty Discount");
  const Icon = isOffer ? Tag : Sparkles;

  return (
    <Badge
      variant="outline"
      className={`gap-1 border font-medium ${
        isOffer
          ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
          : "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
      } ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
