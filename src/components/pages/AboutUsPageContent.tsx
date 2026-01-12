"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import { Target, Users, Zap, Heart } from "lucide-react";
import { StaticPageNav } from "@/components/shared/StaticPageNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To make sports accessible to everyone in Pakistan by connecting players with quality venues through seamless technology."
  },
  {
    icon: Users,
    title: "Community First",
    description: "We believe in building a strong community of sports enthusiasts and venue owners who share our passion for active living."
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Leveraging cutting-edge technology to provide instant bookings, smart pricing, and exceptional user experiences."
  },
  {
    icon: Heart,
    title: "Quality Commitment",
    description: "Every venue on our platform is verified and monitored to ensure you get the best sports experience possible."
  }
];

interface AboutUsPageContentProps {
  initialStats?: any;
}

export function AboutUsPageContent({ initialStats }: AboutUsPageContentProps) {
  // Use initial stats from SSR to prevent loading state
  const { data: stats } = useQuery({
    queryKey: ['about-stats'],
    queryFn: async () => {
      const [venuesResult, citiesResult] = await Promise.all([
        supabase
          .from('venues')
          .select('id, city')
          .eq('status', 'approved'),
        supabase
          .from('bookings')
          .select('id')
      ]);

      const uniqueCities = new Set(venuesResult.data?.map(v => v.city) || []);
      
      return {
        totalVenues: venuesResult.data?.length || 0,
        totalCities: uniqueCities.size || 0,
        totalBookings: citiesResult.data?.length || 0,
      };
    },
    initialData: initialStats,
    staleTime: 5 * 60 * 1000,
  });

  const displayStats = [
    {
      value: stats?.totalVenues || 0,
      label: "Active Venues",
      suffix: "+"
    },
    {
      value: stats?.totalBookings || 0,
      label: "Bookings Made",
      suffix: "+"
    },
    {
      value: stats?.totalCities || 0,
      label: "Cities Covered",
      suffix: ""
    }
  ];

  return (
    <div className="min-h-screen">
      <StaticPageNav activePage="about" />

      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Making Sports Accessible Across Pakistan
            </h1>
            <p className="text-base sm:text-lg text-secondary-foreground/90">
              PakPlay is Pakistan&apos;s leading sports venue booking platform, connecting passionate players with premium facilities nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {displayStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  {stat.suffix}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Founded in 2024, PakPlay was born from a simple observation: finding and booking quality sports venues in Pakistan was unnecessarily complicated. Players struggled to discover venues, compare prices, and make instant bookings, while venue owners missed out on potential customers due to limited online presence.
              </p>
              <p>
                We set out to change that. By building a comprehensive platform that brings together venues across multiple sports, we&apos;ve made it possible for anyone to find and book their perfect playing spot in just a few clicks.
              </p>
              <p>
                Today, PakPlay serves thousands of players and hundreds of venues across major Pakistani cities. We&apos;re proud to be supporting the growth of sports culture in Pakistan by making it easier than ever to stay active and engaged.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">What Drives Us</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Join the PakPlay Community
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Whether you&apos;re a player looking for your next game or a venue owner wanting to grow your business, we&apos;re here to help.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/venues">
                <Button size="lg" variant="outline">
                  Browse Venues
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  List Your Venue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

