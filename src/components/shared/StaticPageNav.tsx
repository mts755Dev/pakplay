"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import ppLogo from "@/assets/pp logo.png";
import { supabase } from "@/integrations/supabase/client";

interface StaticPageNavProps {
  activePage?: string;
}

export function StaticPageNav({ activePage }: StaticPageNavProps) {
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

  const isActive = (page: string) => activePage === page;

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src={ppLogo.src} alt="PakPlay" className="h-10 sm:h-12 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/venues">
            <Button variant="ghost">Browse Venues</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" className={isActive('pricing') ? 'text-primary hover:text-primary' : ''}>
              Pricing
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" className={isActive('about') ? 'text-primary hover:text-primary' : ''}>
              About Us
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" className={isActive('contact') ? 'text-primary hover:text-primary' : ''}>
              Contact Us
            </Button>
          </Link>
          <Link href="/faq">
            <Button variant="ghost" className={isActive('faq') ? 'text-primary hover:text-primary' : ''}>
              FAQs
            </Button>
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

        {/* Mobile Menu */}
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
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-lg ${isActive('pricing') ? 'text-primary' : ''}`}
                >
                  Pricing
                </Button>
              </Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-lg ${isActive('about') ? 'text-primary' : ''}`}
                >
                  About Us
                </Button>
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-lg ${isActive('contact') ? 'text-primary' : ''}`}
                >
                  Contact Us
                </Button>
              </Link>
              <Link href="/faq" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-lg ${isActive('faq') ? 'text-primary' : ''}`}
                >
                  FAQs
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
  );
}


