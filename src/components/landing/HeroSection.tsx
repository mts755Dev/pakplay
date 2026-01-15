"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Zap, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-venue.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { getAllProvinces, getCitiesByProvince } from "@/lib/locationHelpers";

interface HeroSectionProps {
  initialStats?: any;
}

export const HeroSection = ({ initialStats }: HeroSectionProps) => {
  const router = useRouter();
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  
  const provinces = getAllProvinces();
  const cities = selectedProvince ? getCitiesByProvince(selectedProvince) : [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedProvince) params.set('province', selectedProvince);
    if (selectedCity) params.set('city', selectedCity);
    router.push(`/venues${params.toString() ? '?' + params.toString() : ''}`);
  };

  // Use initial stats from SSR
  const { data: stats } = useQuery({
    queryKey: ['hero-stats'],
    queryFn: async () => {
      const { data: venues } = await supabase
        .from('venues')
        .select('id, city')
        .eq('status', 'approved');
      
      const uniqueCities = new Set(venues?.map(v => v.city) || []);
      
      return {
        venues: venues?.length || 0,
        cities: uniqueCities.size || 0,
        bookings: "10,000+",
      };
    },
    initialData: initialStats ? {
      venues: initialStats.totalVenues || 0,
      cities: initialStats.totalCities || 0,
      bookings: "10,000+",
    } : undefined,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="relative bg-gradient-to-br from-secondary via-secondary to-secondary/90 text-secondary-foreground overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      <div className="container mx-auto px-4 py-20 lg:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {/* Badge */}
            <Badge className="bg-primary/20 text-primary-foreground border-primary/30 px-4 py-2 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Pakistan's Leading Sports Booking Platform
            </Badge>

            {/* Main Headline */}
            <div>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
                Where Pakistan
                <span className="block text-primary">Plays</span>
              </h1>
              <p className="text-xl lg:text-2xl mb-4 text-secondary-foreground/90 leading-relaxed">
                Book premium sports venues instantly. Play more, worry less.
              </p>
              <p className="text-lg text-secondary-foreground/70">
                From padel courts to cricket grounds, futsal arenas to badminton courts — find and book the perfect venue in seconds.
              </p>
            </div>

            {/* Quick Location Search */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Province</label>
                  <Select value={selectedProvince} onValueChange={(value) => {
                    setSelectedProvince(value);
                    setSelectedCity("");
                  }}>
                    <SelectTrigger className="bg-white text-gray-900" aria-label="Select Province">
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">City</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedProvince}>
                    <SelectTrigger className="bg-white text-gray-900" aria-label="Select City">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    size="lg" 
                    onClick={handleSearch}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2 text-lg py-6 shadow-xl"
                  >
                    <Search className="w-5 h-5" />
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/venues" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-lg px-8 py-6">
                  <MapPin className="w-5 h-5 mr-2" />
                  Browse All Venues
                </Button>
              </Link>
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-lg px-8 py-6">
                  List Your Venue
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Instant Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Verified Venues</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Best Prices</span>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/20">
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.venues}+</div>
                  <div className="text-sm text-secondary-foreground/70">Venues</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.cities}+</div>
                  <div className="text-sm text-secondary-foreground/70">Cities</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.bookings}</div>
                  <div className="text-sm text-secondary-foreground/70">Bookings</div>
                </div>
              </div>
            )}
          </div>

          {/* Hero Image */}
          <div className="relative lg:block">
            <div className="relative">
              <Image 
                src={heroImage} 
                alt="Professional sports venue facility" 
                className="rounded-2xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-300"
                priority
                quality={75}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 650px"
              />
              {/* Floating Cards */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 max-w-xs hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Easy Booking</div>
                    <div className="text-sm text-gray-600">Book in 60 seconds</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4 max-w-xs hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Across Pakistan</div>
                    <div className="text-sm text-gray-600">All major cities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
