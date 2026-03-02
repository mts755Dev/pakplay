"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HeroSection } from "@/components/landing/HeroSection";
import { SportsCategories } from "@/components/landing/SportsCategories";
import { VenuesShowcase } from "@/components/landing/VenuesShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { StatsSection } from "@/components/landing/StatsSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { BannerAd, InFeedAd } from "@/components/ads/AdSenseUnit";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import ppLogo from "@/assets/pp logo.png";

interface IndexPageProps {
  initialFeaturedVenues?: any[];
  initialStats?: any;
  initialSports?: any[];
}

export function IndexPage({ initialFeaturedVenues = [], initialStats, initialSports = [] }: IndexPageProps) {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load from cache immediately after mount and set authChecked if we have cached data
    const cachedRole = localStorage.getItem('user_role');
    if (cachedRole) {
      setUserRole(cachedRole);
      setAuthChecked(true); // We have cached data, show UI immediately
    }
    
    checkUser();

    // Listen to auth changes for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUser(session.user);
          
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
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('user_role');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      // Get session (this uses cached session, very fast)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        setAuthChecked(true); // Set immediately after getting session
        
        // Fetch fresh role from database in background
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
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('user_role');
        setAuthChecked(true);
      }
    } catch (error) {
      // Silent fail
      setAuthChecked(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      localStorage.removeItem('user_role');
      toast.success("Signed out successfully");
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
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

  const isLoggedIn = !!user;
  const isPlayer = userRole === 'player';
  const isOwner = userRole === 'venue_owner';

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src={ppLogo.src} alt="PakPlay" className="h-12 w-auto" />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4">
            <Link href="/venues">
              <Button variant="ghost" size="sm">Browse Venues</Button>
            </Link>
            <Link href="/offers">
              <Button variant="ghost" size="sm">Offers</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" size="sm">About</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm">Contact Us</Button>
            </Link>

            {mounted && authChecked && (
              <>
                {/* Show "List Your Venue" only when NOT logged in as player */}
                {!isPlayer && !isLoggedIn && (
                  <Link href="/signup">
                    <Button variant="outline" size="sm">Sign Up</Button>
                  </Link>
                )}

                {isLoggedIn ? (
                  <>
                    {/* My Bookings button for players */}
                    {isPlayer && (
                      <Link href="/user/bookings">
                        <Button variant="outline" size="sm">My Bookings</Button>
                      </Link>
                    )}
                    {/* Dashboard button for owners */}
                    {isOwner && (
                      <Link href="/owner/dashboard">
                        <Button size="sm">Dashboard</Button>
                      </Link>
                    )}
                    {/* Sign Out button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSignOut}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link href={getDashboardLink()}>
                    <Button size="sm" suppressHydrationWarning>{getDashboardLabel()}</Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Navigation */}
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
                <Link href="/offers" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">
                    Offers
                  </Button>
                </Link>
                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">
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
                  {mounted && authChecked && (
                    <>
                      {/* Show "List Your Venue" only when NOT logged in as player */}
                      {!isPlayer && !isLoggedIn && (
                        <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full mb-3 text-lg">
                            Sign Up
                          </Button>
                        </Link>
                      )}

                      {isLoggedIn ? (
                        <>
                          {isPlayer && (
                            <Link href="/user/bookings" onClick={() => setMobileMenuOpen(false)}>
                              <Button variant="outline" className="w-full mb-3 text-lg">
                                My Bookings
                              </Button>
                            </Link>
                          )}
                          {isOwner && (
                            <Link href="/owner/dashboard" onClick={() => setMobileMenuOpen(false)}>
                              <Button className="w-full mb-3 text-lg">
                                Dashboard
                              </Button>
                            </Link>
                          )}
                          <Button 
                            variant="ghost" 
                            className="w-full text-lg text-muted-foreground hover:text-destructive"
                            onClick={handleSignOut}
                          >
                            <LogOut className="w-5 h-5 mr-2" />
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full text-lg" suppressHydrationWarning>
                            {getDashboardLabel()}
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <HeroSection initialStats={initialStats} userRole={userRole} />
      
      {/* Ad after Hero Section */}
      <div className="container mx-auto px-4 my-8">
        <BannerAd className="max-w-4xl mx-auto" />
      </div>
      
      <SportsCategories initialSports={initialSports} />
      <VenuesShowcase initialVenues={initialFeaturedVenues} />
      
      {/* Ad between sections */}
      <div className="container mx-auto px-4 my-8">
        <InFeedAd />
      </div>
      
      <HowItWorks />
      <StatsSection initialStats={initialStats} />
      <Testimonials />
      
      {/* Ad before CTA */}
      <div className="container mx-auto px-4 my-8">
        <InFeedAd />
      </div>
      
      <CTASection userRole={userRole} />
      <Footer />
    </div>
  );
}
