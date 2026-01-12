"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import ppLogo from "@/assets/pp logo.png";
import Image from "next/image";
import { supabase } from "@/integrations/supabase/client";

const faqs = [
  {
    question: "How do I book a venue?",
    answer: "Browse available venues, select your preferred date and time, and complete the booking process. You'll receive instant confirmation via WhatsApp and email."
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer: "Yes, you can cancel or reschedule bookings up to 24 hours before your scheduled time. Contact the venue directly through WhatsApp for assistance."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including credit/debit cards, mobile wallets, and cash payments at the venue. Payment options vary by venue."
  },
  {
    question: "How do I list my venue on PakPlay?",
    answer: "Click on 'List Your Venue' button, create an account, and fill in your venue details. Our team will review and approve your listing within 24-48 hours."
  },
  {
    question: "Is there a commission fee for venue owners?",
    answer: "Yes, we charge a small commission on each booking to maintain the platform and provide customer support. Check our Pricing page for detailed information."
  },
  {
    question: "What sports does PakPlay support?",
    answer: "We support a wide range of sports including Padel, Cricket, Futsal, Badminton, Tennis, Basketball, and many more. Check our Browse by Sport section on the homepage."
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach us via WhatsApp, email, or through the contact form on our website. We typically respond within a few hours during business hours."
  },
  {
    question: "Are the venues verified?",
    answer: "Yes, all venues listed on PakPlay are verified by our team to ensure quality and authenticity. We also display ratings and reviews from real users."
  },
  {
    question: "Can I get a refund if the venue is unavailable?",
    answer: "Yes, if a venue becomes unavailable due to unforeseen circumstances, you'll receive a full refund or can reschedule at no extra cost."
  },
  {
    question: "How does dynamic pricing work?",
    answer: "Some venues offer dynamic pricing based on demand, time of day, and day of the week. Peak hours may have higher rates, while off-peak times offer discounts."
  }
];

export function FAQPageClient() {
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
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost">About Us</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Contact Us</Button>
            </Link>
            <Link href="/faq">
              <Button variant="ghost" className="text-primary hover:text-primary">FAQs</Button>
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
                <Link href="/faq" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg text-primary">
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

      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-secondary-foreground/90 max-w-2xl mx-auto">
            Find answers to common questions about PakPlay, bookings, and venue listings
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-12 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Still Have Questions?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

