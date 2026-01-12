"use client";

import { TrendingUp, MapPin, Users, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatsSectionProps {
  initialStats?: any;
}

export const StatsSection = ({ initialStats }: StatsSectionProps) => {
  // Use initial stats from SSR
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [venuesResult, bookingsResult, usersResult] = await Promise.all([
        supabase.from('venues').select('id, city').eq('status', 'approved'),
        supabase.from('bookings').select('id'),
        supabase.from('profiles').select('id'),
      ]);

      const uniqueCities = new Set(venuesResult.data?.map(v => v.city) || []);

      return {
        totalVenues: venuesResult.data?.length || 0,
        totalBookings: bookingsResult.data?.length || 0,
        totalUsers: usersResult.data?.length || 0,
        totalCities: uniqueCities.size || 0,
      };
    },
    initialData: initialStats ? {
      totalVenues: initialStats.totalVenues || 0,
      totalBookings: initialStats.totalBookings || 0,
      totalUsers: initialStats.totalUsers || 0,
      totalCities: initialStats.totalCities || 0,
    } : undefined,
    staleTime: 5 * 60 * 1000,
  });

  const displayStats = [
    {
      icon: MapPin,
      value: stats?.totalVenues || 0,
      label: "Active Venues",
      suffix: "+"
    },
    {
      icon: Calendar,
      value: stats?.totalBookings || 0,
      label: "Bookings Made",
      suffix: "+"
    },
    {
      icon: TrendingUp,
      value: stats?.totalCities || 0,
      label: "Cities Covered",
      suffix: ""
    },
    {
      icon: Users,
      value: stats?.totalUsers || 0,
      label: "Happy Players",
      suffix: "+"
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-secondary via-secondary/95 to-secondary text-secondary-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-secondary-foreground/80 max-w-2xl mx-auto px-4">
            Join Pakistan's fastest-growing sports community
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {displayStats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-4 sm:p-6 lg:p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-1 sm:mb-2 text-primary break-words">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                {stat.suffix}
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-secondary-foreground/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

