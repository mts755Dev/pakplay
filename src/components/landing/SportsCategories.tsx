"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Sport emojis mapping
const sportEmojis: Record<string, string> = {
  padel: "🎾",
  cricket: "🏏",
  futsal: "⚽",
  badminton: "🏸",
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  volleyball: "🏐",
  'table-tennis': "🏓",
  squash: "🎾",
  hockey: "🏑",
  swimming: "🏊",
  boxing: "🥊",
  'martial-arts': "🥋",
  gym: "🏋️",
  snooker: "🎱",
  golf: "⛳",
  kabaddi: "🤼",
  athletics: "🏃",
  cycling: "🚴",
  'multi-sport': "🏆",
};

interface SportCount {
  name: string;
  sport_type: string;
  count: number;
}

interface SportsCategoriesProps {
  initialSports?: SportCount[];
}

export const SportsCategories = ({ initialSports = [] }: SportsCategoriesProps) => {
  // Use initial sports from SSR
  const { data: sports = [] } = useQuery({
    queryKey: ['top-sports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues' as any)
        .select('sport_type')
        .eq('status', 'approved');
      
      if (error) throw error;
      
      // Aggregate by sport type
      const sportCounts: Record<string, number> = {};
      data?.forEach((venue: any) => {
        const sport = venue.sport_type;
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      });
      
      // Convert to array and sort
      const result = Object.entries(sportCounts)
        .map(([sport_type, count]) => ({ sport_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      
      return result as SportCount[];
    },
    initialData: initialSports,
    staleTime: 5 * 60 * 1000,
  });
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
          Browse by Sport
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {sports && sports.length > 0 ? (
            sports.map((sport) => {
              const sportEmoji = sportEmojis[sport.sport_type] || "🎾";
              
              return (
                <Link href={`/venues?sport=${sport.sport_type}`} key={sport.sport_type}>
                  <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl" role="img" aria-label={sport.name}>
                        {sportEmoji}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 text-foreground">{sport.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {sport.count} {sport.count === 1 ? 'venue' : 'venues'}
                    </p>
                  </Card>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No sports venues available yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
