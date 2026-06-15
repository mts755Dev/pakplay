"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Mail, Phone, Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { submitContactForm } from "@/lib/server-actions";
import { useToast } from "@/hooks/use-toast";
import ppLogo from "@/assets/pp logo.png";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export function ContactUsPageClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, isPlayer, isOwner, userRole, authReady, handleSignOut } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await submitContactForm({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      if (!result.success) throw new Error(result.error);

      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
              <Button variant="ghost" className="text-primary hover:text-primary">Contact Us</Button>
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
                  <Button variant="ghost" className="w-full justify-start text-lg text-primary">
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
            Get in Touch
          </h1>
          <p className="text-base sm:text-lg text-secondary-foreground/90 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form and our team will get back to you within 24 hours.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:pakplay.co@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                      pakplay.co@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone & WhatsApp</h3>
                    <a href="tel:+923166742882" className="text-muted-foreground hover:text-primary transition-colors block">
                      +92 316 6742882
                    </a>
                    <a 
                      href="https://wa.me/923166742882" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      Message on WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-accent/5 rounded-lg">
                <h3 className="font-semibold mb-2">Business Hours</h3>
                <p className="text-muted-foreground">Monday - Friday: 2:00 PM - 10:00 PM</p>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we help you?"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    className="mt-2"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

