"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Ready to Play?</span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
            Start Booking Your Favorite Venues Today
          </h2>
          
          <p className="text-xl lg:text-2xl mb-10 text-primary-foreground/90 leading-relaxed">
            Join thousands of players across Pakistan. Find, book, and play at the best sports venues near you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/venues">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-7 shadow-2xl group"
              >
                Browse Venues
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/50 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-lg px-10 py-7 text-white"
              >
                List Your Venue
              </Button>
            </Link>
          </div>

          <p className="text-sm text-primary-foreground/70 mt-8">
            ⚡ Instant confirmation • 🔒 Secure booking • 💯 100% verified venues
          </p>
        </div>
      </div>
    </section>
  );
};

