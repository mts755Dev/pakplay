"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import { Check, Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import ppLogo from "@/assets/pp logo.png";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

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
  const { isLoggedIn, isPlayer, isOwner, userRole, authReady, handleSignOut } = useAuth();

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

