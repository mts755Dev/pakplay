"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { useState } from "react";
import ppLogo from "@/assets/pp logo.png";
import { useAuth } from "@/contexts/AuthContext";

interface StaticPageNavProps {
  activePage?: string;
}

export function StaticPageNav({ activePage }: StaticPageNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userRole, isLoggedIn, isPlayer, isOwner, authReady, handleSignOut } = useAuth();

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
          <Link href="/offers">
            <Button variant="ghost" className={isActive('offers') ? 'text-primary hover:text-primary' : ''}>
              Offers
            </Button>
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

          {authReady && (
            <>
              {!isPlayer && !isLoggedIn && (
                <Link href="/signup">
                  <Button variant="outline" size="sm">Sign Up</Button>
                </Link>
              )}

              {isLoggedIn ? (
                <>
                  {isPlayer && (
                    <Link href="/user/bookings">
                      <Button variant="outline" size="sm">My Bookings</Button>
                    </Link>
                  )}
                  {isOwner && (
                    <Link href="/owner/dashboard">
                      <Button size="sm">Dashboard</Button>
                    </Link>
                  )}
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
              <Link href="/offers" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-lg ${isActive('offers') ? 'text-primary' : ''}`}
                >
                  Offers
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
              <div className="border-t pt-4 mt-4">
                {authReady && (
                  <>
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
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSignOut();
                          }}
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
  );
}
