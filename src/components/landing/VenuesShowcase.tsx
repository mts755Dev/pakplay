import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MapPin, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Venue = Tables<'venues'>;
type VenuePhoto = Tables<'venue_photos'>;
type SpecialOffer = Tables<'special_offers'>;

interface VenueWithData extends Venue {
  venue_photos?: VenuePhoto[];
  active_offer?: SpecialOffer | null;
  calculated_rating?: number;
  review_count?: number;
}

const formatTime = (time: string | null) => {
  if (!time) return 'N/A';
  try {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return 'N/A';
  }
};

interface VenuesShowcaseProps {
  initialVenues?: any[];
}

export const VenuesShowcase = ({ initialVenues = [] }: VenuesShowcaseProps) => {
  const { data: venues, isLoading } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*, venue_photos(*)')
        .eq('status', 'approved')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(9);
      
      if (error) throw error;

      // Fetch active offers and reviews for each venue
      const venuesWithData = await Promise.all((data || []).map(async (venue) => {
        // Fetch active offer
        const { data: offer } = await supabase
          .from('special_offers')
          .select('*')
          .eq('venue_id', venue.id)
          .eq('is_active', true)
          .lte('valid_from', new Date().toISOString())
          .gte('valid_until', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fetch reviews to calculate actual rating
        const { data: reviews } = await supabase
          .from('venue_reviews')
          .select('rating')
          .eq('venue_id', venue.id);

        // Calculate average rating from reviews
        const calculatedRating = reviews && reviews.length > 0
          ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          : 0;
        
        return { 
          ...venue, 
          active_offer: offer,
          calculated_rating: calculatedRating,
          review_count: reviews?.length || 0
        };
      }));

      // Sort by calculated rating
      venuesWithData.sort((a, b) => b.calculated_rating - a.calculated_rating);

      return venuesWithData;
    },
    initialData: initialVenues,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3 text-foreground">
              Featured Venues
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore top-rated sports facilities with instant booking
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <Card key={i} className="overflow-hidden h-full">
                <div className="h-48 bg-secondary/10 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-secondary/10 animate-pulse rounded" />
                  <div className="h-4 bg-secondary/10 animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-secondary/10 animate-pulse rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3 text-foreground">
            Featured Venues
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore top-rated sports facilities with instant booking
          </p>
        </div>
        
        {venues && venues.length > 0 ? (
          <>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {venues.map((venue) => {
                const primaryPhoto = venue.venue_photos?.find((p: any) => p.is_primary)?.photo_url 
                  || venue.venue_photos?.[0]?.photo_url;
                
                // Optimize Supabase images with transformation and cache parameters
                const optimizedPhoto = primaryPhoto && primaryPhoto.includes('supabase.co/storage')
                  ? `${primaryPhoto}?width=500&height=300&quality=75&format=webp`
                  : primaryPhoto;
                
                return (
                  <Link href={`/venue/${venue.slug}`} key={venue.id}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full">
                      <div className="h-48 bg-secondary/10 relative">
                        {optimizedPhoto ? (
                          <img 
                            src={optimizedPhoto} 
                            alt={venue.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No photo
                          </div>
                        )}
                        {Number(venue.calculated_rating) > 0 ? (
                          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {venue.calculated_rating.toFixed(1)}
                            <span className="text-xs text-gray-600">({venue.review_count})</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 text-foreground">{venue.name}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="line-clamp-1">
                            {venue.address}, {venue.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-4 text-sm">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>
                            {venue.opening_time && venue.closing_time 
                              ? `${formatTime(venue.opening_time)} - ${formatTime(venue.closing_time)}`
                              : '24/7 Open'
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            {venue.active_offer ? (
                              <>
                                <p className="text-sm text-muted-foreground">Starting from</p>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-2xl font-bold text-primary">
                                    PKR {venue.active_offer.offer_price.toLocaleString()}/hr
                                  </p>
                                  <p className="text-sm text-muted-foreground line-through">
                                    PKR {venue.active_offer.original_price.toLocaleString()}
                                  </p>
                                </div>
                                {venue.active_offer.discount_percentage && (
                                  <Badge variant="destructive" className="text-xs">
                                    {venue.active_offer.discount_percentage}% OFF
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-muted-foreground">Starting from</p>
                                <p className="text-2xl font-bold text-primary">
                                  PKR {venue.price_per_hour.toLocaleString()}/hr
                                </p>
                              </>
                            )}
                          </div>
                          <Button>Book Now</Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
        </div>

        <div className="text-center">
          <Link href="/venues">
            <Button size="lg" variant="outline">
              View All Venues
            </Button>
          </Link>
        </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No featured venues available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};
