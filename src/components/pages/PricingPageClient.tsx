"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import { Check, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import ppLogo from "@/assets/pp logo.png";
import Image from "next/image";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    name: "Standard Plan",
    price: "PKR 999",
    period: "per month",
    onboardingFee: "PKR 5,000",
    description: "Everything you need to grow your sports venue business",
    features: [
      "List unlimited venues",
      "Advanced analytics & insights",
      "WhatsApp notifications",
      "Priority support",
      "Automated booking management",
      "Real-time availability updates",
      "Customer review management"
    ],
    cta: "Get Started",
    highlighted: true
  }
];

export function PricingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load from cache immediately after mount
    const cachedRole = localStorage.getItem('user_role');
    if (cachedRole) {
      setUserRole(cachedRole);
      setLoading(false);
    }
    
    checkUser();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUser(session.user);
          
          const { data: profile} = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role) {
            setUserRole(profile.role);
            localStorage.setItem('user_role', profile.role);
          }
        } else {
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('user_role');
        }
        setLoading(false);
      } catch (error) {
        // Handle auth state change errors during logout/navigation
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch fresh role from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role) {
          setUserRole(profile.role);
          localStorage.setItem('user_role', profile.role);
        }
      } else {
        localStorage.removeItem('user_role');
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'venue_owner') return '/owner/dashboard';
    return '/signin';
  };

  const getDashboardLabel = () => {
    if (userRole === 'admin') return 'Admin Dashboard';
    if (userRole === 'venue_owner') return 'Dashboard';
    return 'Sign In';
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src={ppLogo} alt="PakPlay" className="h-10 sm:h-12 w-auto" />
          </Link>
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/venues">
              <Button variant="ghost">Browse Venues</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="text-primary hover:text-primary">Pricing</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost">About Us</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Contact Us</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline">List Your Venue</Button>
            </Link>
            {mounted && (
              <Link href={getDashboardLink()}>
                <Button suppressHydrationWarning>{getDashboardLabel()}</Button>
              </Link>
            )}
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/venues" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">
                    Browse Venues
                  </Button>
                </Link>
                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg text-primary">
                    Pricing
                  </Button>
                </Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">
                    About Us
                  </Button>
                </Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">
                    Contact Us
                  </Button>
                </Link>
                <div className="border-t pt-4 mt-4">
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full mb-3 text-lg">
                      List Your Venue
                    </Button>
                  </Link>
                  {mounted && (
                    <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full text-lg" suppressHydrationWarning>
                        {getDashboardLabel()}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-lg text-secondary-foreground/90 max-w-2xl mx-auto">
            One straightforward plan with everything you need to manage and grow your sports venue business.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 sm:py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className="p-4 sm:p-6 md:p-8 border-primary border-2 shadow-xl"
              >
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center">{plan.name}</h3>
                <div className="text-center mb-4 sm:mb-6">
                  <div className="mb-2 sm:mb-3">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground ml-1 sm:ml-2 text-sm sm:text-base md:text-lg">/ {plan.period}</span>
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">
                    <span className="font-semibold">+ {plan.onboardingFee}</span> one-time onboarding fee
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-center text-sm sm:text-base md:text-lg">{plan.description}</p>
                <Link href="/signup">
                  <Button 
                    className="w-full mb-6 sm:mb-8 text-base sm:text-lg py-5 sm:py-6"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">What's included:</h4>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Questions About Pricing?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Contact our sales team for more information
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Contact Sales
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

