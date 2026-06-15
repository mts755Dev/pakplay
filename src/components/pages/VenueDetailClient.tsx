"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Phone, Loader2, Star, CheckCircle, Wifi, Car, Droplets, Wind, Zap, Shield, Award, X, Image as ImageIcon, ArrowRight, Globe, Facebook, Instagram, Twitter, Play, TrendingUp, Users, Menu } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { fetchVenueBySlug, fetchVenueBySubdomain } from "@/lib/server-actions";
import { Tables } from "@/integrations/supabase/types";
import { SpecialOfferBadge } from "@/components/SpecialOfferBadge";
import { Turnstile } from "@marsidev/react-turnstile";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile-config";
import { formatFullLocation, getCityById } from "@/lib/locationHelpers";
import ppLogo from "@/assets/pp logo.png";
import { AdBanner, AdRectangle, AdNative } from "@/components/AdSlot";
import {
  createPlayerBooking,
  fetchPlayerProfileServer,
  fetchVenueBookingsForDate,
  fetchVenueLoyaltyTiers,
  fetchUserLoyaltyStatus,
  fetchVenueReviews,
  submitVenueReview,
  LoyaltyTier,
  type VenueDayBooking,
} from "@/lib/server-actions";
import { uploadReviewPhotos } from "@/lib/file-utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildBookingWhatsAppMessage,
  getBookingWhatsAppTarget,
} from "@/lib/booking-whatsapp";
import {
  getCachedPlayerBookingDetails,
  resolvePlayerBookingDetails,
} from "@/lib/player-profile";
import { BookingTimeSlotGrid } from "@/components/BookingTimeSlotGrid";
import { bookingToInterval, getCourtAvailability } from "@/lib/court-availability";

type Venue = Tables<'venues'>;
type VenuePhoto = Tables<'venue_photos'>;
type VenueReview = Tables<'venue_reviews'>;
type SpecialOffer = Tables<'special_offers'>;

interface VenueWithPhotos extends Venue {
  venue_photos: VenuePhoto[];
}

interface VenueWithReviews extends VenueWithPhotos {
  reviews: VenueReview[];
}

interface VenueDetailClientProps {
  slug: string;
  initialVenue?: VenueWithReviews;
  initialReviews?: VenueReview[];
  initialActiveOffer?: SpecialOffer | null;
  initialLoyaltyTiers?: any[] | null;
  initialLoyaltyStatus?: any | null;
  initialUserEmail?: string | null;
  initialPlayerProfile?: {
    fullName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  initialIsOwner?: boolean;
}

export function VenueDetailClient({ 
  slug,
  initialVenue,
  initialReviews = [],
  initialActiveOffer,
  initialLoyaltyTiers = null,
  initialLoyaltyStatus = null,
  initialUserEmail = null,
  initialPlayerProfile = null,
  initialIsOwner = false,
}: VenueDetailClientProps) {
  const router = useRouter();
  const { user: authUser, authReady, isLoggedIn } = useAuth();
  const [venue, setVenue] = useState<VenueWithReviews | null>(initialVenue || null);
  const [loading, setLoading] = useState(!initialVenue); // Only loading if no initial data
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<VenueReview[]>(initialReviews || []);
  const [activeOffer, setActiveOffer] = useState<SpecialOffer | null>(initialActiveOffer ?? null);
  const [activeSection, setActiveSection] = useState("home");

  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [playerName, setPlayerName] = useState(
    initialIsOwner ? "" : initialPlayerProfile?.fullName || getCachedPlayerBookingDetails().fullName || ""
  );
  const [playerPhone, setPlayerPhone] = useState(
    initialIsOwner ? "" : initialPlayerProfile?.phone || getCachedPlayerBookingDetails().phone || ""
  );
  const [playerEmail, setPlayerEmail] = useState(
    initialIsOwner
      ? ""
      : initialPlayerProfile?.email ||
          initialUserEmail ||
          getCachedPlayerBookingDetails().email ||
          ""
  );
  const [dayBookings, setDayBookings] = useState<VenueDayBooking[]>([]);
  const [loadingDayBookings, setLoadingDayBookings] = useState(false);

  // Review form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [reviewPhotoPreviews, setReviewPhotoPreviews] = useState<string[]>([]);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [isOwner, setIsOwner] = useState(initialIsOwner);
  // Initialize currentUser with SSR data if available
  const [currentUser, setCurrentUser] = useState<any>(
    initialUserEmail ? { email: initialUserEmail } : null
  );
  const [userProfile, setUserProfile] = useState<any>(null);
  // If we have SSR loyalty data, we know auth was checked on server
  const [authChecked, setAuthChecked] = useState(initialLoyaltyTiers !== null);

  // Loyalty program state - initialize with server-side data
  const [loyaltyTiers, setLoyaltyTiers] = useState<any[]>(initialLoyaltyTiers || []);
  const [loyaltyStatus, setLoyaltyStatus] = useState<{
    completedBookings: number;
    currentTier: any | null;
    nextTier: any | null;
  } | null>(initialLoyaltyStatus);
  const [selectedDiscount, setSelectedDiscount] = useState<'offer' | 'loyalty' | null>(null);
  const hasInitialLoyaltyData = initialLoyaltyTiers !== null; // Track if we have SSR data

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  };

  // Check if we're on a custom subdomain
  const getSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // If subdomain exists (not main domain)
    if (parts.length >= 3 && parts[0] !== 'www' && hostname !== 'localhost' && !hostname.startsWith('127.0.0.1') && hostname !== 'pakplay.co') {
      return parts[0];
    }
    return null;
  };

  useEffect(() => {
    // Skip if we have initial data from SSR
    if (initialVenue) {
      return;
    }
    
    const subdomain = getSubdomain();
    
    if (subdomain) {
      // Fetch by subdomain
      fetchVenueBySubdomainClient(subdomain);
    } else if (slug) {
      // Fetch by slug (normal route)
      fetchVenue();
    }
  }, [slug, initialVenue]);

  // Scroll spy effect - update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'gallery', 'reviews', 'contact'];
      const scrollPosition = window.scrollY + 200; // Offset for better UX
      
      // Check if we're near the bottom of the page (footer area)
      const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
      
      if (isNearBottom) {
        setActiveSection('contact');
        return;
      }

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [venue]);

  // Sync logged-in state from AuthContext (avoids hanging client Supabase auth calls)
  useEffect(() => {
    if (!authReady) return;

    if (isLoggedIn && authUser) {
      setCurrentUser((prev: any) => prev ?? authUser);
      const venueOwner = !!venue && venue.owner_id === authUser.id;
      setIsOwner(venueOwner);

      if (!venueOwner) {
        const cached = getCachedPlayerBookingDetails();
        const details = resolvePlayerBookingDetails(userProfile, authUser);
        setPlayerEmail((prev) => prev || details.email || cached.email || initialUserEmail || "");
        setPlayerName((prev) => prev || details.fullName || cached.fullName || "");
        setPlayerPhone((prev) => prev || details.phone || cached.phone || "");
      }

      setAuthChecked(true);
      return;
    }

    if (!initialUserEmail) {
      setCurrentUser(null);
      setIsOwner(false);
    }

    setAuthChecked(true);
  }, [authReady, isLoggedIn, authUser, userProfile, venue, initialUserEmail]);

  // Fetch profile via server action when name/phone still missing
  useEffect(() => {
    if (!authReady || !authUser?.id || isOwner) return;

    const needsName = !playerName;
    const needsPhone = !playerPhone;
    if (!needsName && !needsPhone) return;

    let cancelled = false;

    (async () => {
      const { profile, bookingDetails } = await fetchPlayerProfileServer(authUser.id);
      if (cancelled) return;

      if (profile) setUserProfile(profile);

      const cached = getCachedPlayerBookingDetails();
      const details = bookingDetails ?? resolvePlayerBookingDetails(profile, authUser);
      const fullName = details.fullName || cached.fullName || "";
      const phone = details.phone || cached.phone || "";
      const email = details.email || cached.email || "";
      setPlayerName((prev) => prev || fullName);
      setPlayerPhone((prev) => prev || phone);
      setPlayerEmail((prev) => prev || email);
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, authUser, isOwner, playerName, playerPhone]);

  // Fetch loyalty tiers and user loyalty status (only if not provided by SSR)
  useEffect(() => {
    // Skip entirely if we have SSR data
    if (hasInitialLoyaltyData) return;

    const fetchLoyaltyData = async () => {
      if (!venue) return;

      try {
        // Only fetch if we don't have initial data
        const tiers = await fetchVenueLoyaltyTiers(venue.id);
        setLoyaltyTiers(tiers);

        // Fetch user's loyalty status if logged in
        if (currentUser?.email) {
          const status = await fetchUserLoyaltyStatus(venue.id, currentUser.email);
          setLoyaltyStatus(status);
        }
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
      }
    };

    fetchLoyaltyData();
  }, [venue, currentUser, hasInitialLoyaltyData]);

  const fetchVenue = async () => {
    try {
      const data = await fetchVenueBySlug(slug);

      if (!data) {
        toast.error("Venue not found");
        return;
      }

      setReviews(data.reviews || []);
      setVenue({ ...data, reviews: data.reviews || [] });
      setActiveOffer(data.active_offer || null);

      if ((data as any).contact_email) {
        setOwnerEmail((data as any).contact_email);
      }
    } catch (error) {
      toast.error("Failed to load venue details");
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueBySubdomainClient = async (subdomain: string) => {
    try {
      const data = await fetchVenueBySubdomain(subdomain);

      if (!data) {
        toast.error("Venue not found");
        return;
      }

      setReviews(data.reviews || []);
      setVenue({ ...data, reviews: data.reviews || [] });
      setActiveOffer(data.active_offer || null);

      if ((data as any).contact_email) {
        setOwnerEmail((data as any).contact_email);
      }
    } catch (error) {
      toast.error("Failed to load venue details");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOffer = async (venueId: string) => {
    try {
      const data = await fetchVenueBySlug(slug);
      if (data?.id === venueId) {
        setActiveOffer(data.active_offer || null);
      }
    } catch {
      // Silent fail for offers
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatWhatsAppNumber = (phoneNumber: string) => {
    // Remove all non-digit characters
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, replace it with Pakistan country code (92)
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '92' + cleanNumber.substring(1);
    }
    
    // If number doesn't start with country code, add Pakistan code
    if (!cleanNumber.startsWith('92')) {
      cleanNumber = '92' + cleanNumber;
    }
    
    return cleanNumber;
  };

  const calculateTotalHours = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    // If end time is before or equal to start time, it means booking crosses midnight
    if (end <= start) {
      // Add one day to end time
      end = new Date(`2000-01-02T${endTime}`);
    }
    
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours;
  };

  const totalCourts = venue?.number_of_courts ?? 1;

  const courtAvailability = useMemo(() => {
    if (!startTime || !endTime || calculateTotalHours() <= 0) return null;

    const intervals = dayBookings.map((b) => bookingToInterval(b.start_time, b.end_time));
    return getCourtAvailability(totalCourts, intervals, startTime, endTime);
  }, [dayBookings, startTime, endTime, totalCourts]);

  useEffect(() => {
    if (!bookingDate || !venue?.id) {
      setDayBookings([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingDayBookings(true);
      const result = await fetchVenueBookingsForDate(venue.id, bookingDate);
      if (!cancelled) {
        setDayBookings(result.bookings);
        setLoadingDayBookings(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingDate, venue?.id]);

  const calculateTotalPrice = () => {
    if (!bookingDate || !startTime || !endTime || !venue) return 0;
    
    const hours = calculateTotalHours();
    let pricePerHour = venue.price_per_hour;
    let discountPercent = 0;

    // Apply selected discount
    if (selectedDiscount === 'offer' && activeOffer) {
      pricePerHour = activeOffer.offer_price;
    } else if (selectedDiscount === 'loyalty' && loyaltyStatus?.currentTier) {
      discountPercent = loyaltyStatus.currentTier.discount_percent;
    }

    const subtotal = hours * pricePerHour;
    const discountAmount = (subtotal * discountPercent) / 100;
    return Math.round(subtotal - discountAmount);
  };

  const handleBooking = async () => {
    if (!venue) return;

    if (!bookingDate || !startTime || !endTime || !playerName || !playerPhone || !playerEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalHours = calculateTotalHours();
    if (totalHours <= 0) {
      toast.error("Invalid time selection");
      return;
    }
    
    if (totalHours > 8) {
      toast.error("Booking duration cannot exceed 8 hours. Please select a shorter time slot.");
      return;
    }

    // Validate booking is not in the past and is at least 1 hour in advance
    const now = new Date();
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Check if booking time has already passed
    if (bookingDateTime < now) {
      toast.error("Cannot book for past dates or times");
      return;
    }

    // Players must book at least 1 hour in advance; owners can book walk-ins
    if (!isOwner && bookingDateTime < oneHourFromNow) {
      toast.error("Please book at least 1 hour in advance");
      return;
    }

    if (courtAvailability && !courtAvailability.available) {
      toast.error("No courts available for this time slot. Please choose a different time.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createPlayerBooking({
        venueId: venue.id,
        bookingDate,
        startTime,
        endTime,
        totalHours: calculateTotalHours(),
        totalPrice: calculateTotalPrice(),
        playerName,
        playerPhone,
        playerEmail,
        notes: null,
        discountType: !isOwner ? selectedDiscount : null,
        discountLabel:
          !isOwner && selectedDiscount === "offer" && activeOffer
            ? activeOffer.offer_name || "Special Offer"
            : !isOwner && selectedDiscount === "loyalty" && loyaltyStatus?.currentTier
              ? `${loyaltyStatus.currentTier.tier_name} Loyalty`
              : null,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create booking");
      }

      const totalPrice = calculateTotalPrice();
      const message = buildBookingWhatsAppMessage({
        isOwnerBooking: isOwner,
        venueName: venue.name,
        bookingDate,
        startTimeLabel: formatTime(startTime),
        endTimeLabel: formatTime(endTime),
        totalHours: calculateTotalHours(),
        playerName,
        playerPhone,
        playerEmail,
        totalPrice,
      });

      const whatsappTarget = getBookingWhatsAppTarget(
        isOwner,
        playerPhone,
        venue.whatsapp_number
      );
      const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(whatsappTarget)}?text=${encodeURIComponent(message)}`;
      
      toast.success(
        isOwner
          ? "Booking saved! Opening WhatsApp to message the customer"
          : "Booking request sent! Check your WhatsApp"
      );
      
      // Clear form fields first
      setBookingDate("");
      setStartTime("");
      setEndTime("");
      setPlayerName("");
      setPlayerPhone("");
      setPlayerEmail("");
      setDayBookings([]);

      // Open WhatsApp in new tab
      try {
        window.open(whatsappUrl, '_blank');
      } catch (err) {
        console.error('Failed to open WhatsApp:', err);
        toast.error("Popup blocked! Please allow popups to open WhatsApp.");
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + reviewPhotos.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }

    setReviewPhotos(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReviewPhoto = (index: number) => {
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
    setReviewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async () => {
    if (!venue) return;

    if (!reviewName || !reviewText) {
      toast.error("Please fill in all review fields");
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the captcha verification");
      return;
    }

    setSubmittingReview(true);

    try {
      let photoUrls: string[] = [];

      if (reviewPhotos.length > 0) {
        const uploadResult = await uploadReviewPhotos(venue.id, reviewPhotos);
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        photoUrls = uploadResult.urls;
      }

      const result = await submitVenueReview({
        venueId: venue.id,
        customerName: reviewName,
        rating: reviewRating,
        reviewText: reviewText,
        photoUrls,
        captchaToken,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }

      toast.success("Review submitted successfully!");

      setReviewName("");
      setReviewRating(5);
      setReviewText("");
      setReviewPhotos([]);
      setReviewPhotoPreviews([]);
      setCaptchaToken("");
      setTurnstileKey(prev => prev + 1);

      const reviewsResult = await fetchVenueReviews(venue.id);
      if (!reviewsResult.error) {
        setReviews(reviewsResult.reviews);
        setVenue((prev) => (prev ? { ...prev, reviews: reviewsResult.reviews } : prev));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    
    // For contact section, scroll to map if exists, otherwise scroll to footer
    if (section === 'contact') {
      const element = document.getElementById('contact');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Scroll to footer if no map
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    } else {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Venue not found</h1>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  const primaryPhoto = venue.venue_photos.find(p => p.is_primary) || venue.venue_photos[0];
  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            {/* Venue Logo - Left */}
            <div className="flex items-center min-w-0 md:flex-1">
              {(venue as any).logo_url ? (
                <img 
                  src={(venue as any).logo_url} 
                  alt={venue.name}
                  className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-full mr-2 sm:mr-3 shrink-0"
                />
              ) : null}
              <span className="font-bold text-sm sm:text-base md:text-lg text-gray-900 truncate">{venue.name}</span>
            </div>
            
            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 transform -translate-x-1/2">
              <button onClick={() => scrollToSection('home')} className={`font-medium transition-colors whitespace-nowrap ${activeSection === 'home' ? 'text-blue-600' : 'text-muted-foreground hover:text-blue-600'}`}>
                Home
              </button>
              <button onClick={() => scrollToSection('about')} className={`font-medium transition-colors whitespace-nowrap ${activeSection === 'about' ? 'text-blue-600' : 'text-muted-foreground hover:text-blue-600'}`}>
                About
              </button>
              <button onClick={() => scrollToSection('gallery')} className={`font-medium transition-colors whitespace-nowrap ${activeSection === 'gallery' ? 'text-blue-600' : 'text-muted-foreground hover:text-blue-600'}`}>
                Gallery
              </button>
              <button onClick={() => scrollToSection('reviews')} className={`font-medium transition-colors whitespace-nowrap ${activeSection === 'reviews' ? 'text-blue-600' : 'text-muted-foreground hover:text-blue-600'}`}>
                Reviews
              </button>
              <button onClick={() => scrollToSection('contact')} className={`font-medium transition-colors whitespace-nowrap ${activeSection === 'contact' ? 'text-blue-600' : 'text-muted-foreground hover:text-blue-600'}`}>
                Contact
              </button>
            </div>

            {/* Right Side - Mobile Menu & Powered By */}
            <div className="flex items-center gap-2 ml-auto">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <div className="flex flex-col gap-4 mt-8">
                    <button 
                      onClick={() => {
                        scrollToSection('home');
                        setMobileMenuOpen(false);
                      }} 
                      className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeSection === 'home' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Home
                    </button>
                    <button 
                      onClick={() => {
                        scrollToSection('about');
                        setMobileMenuOpen(false);
                      }} 
                      className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeSection === 'about' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      About
                    </button>
                    <button 
                      onClick={() => {
                        scrollToSection('gallery');
                        setMobileMenuOpen(false);
                      }} 
                      className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeSection === 'gallery' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Gallery
                    </button>
                    <button 
                      onClick={() => {
                        scrollToSection('reviews');
                        setMobileMenuOpen(false);
                      }} 
                      className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeSection === 'reviews' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Reviews
                    </button>
                    <button 
                      onClick={() => {
                        scrollToSection('contact');
                        setMobileMenuOpen(false);
                      }} 
                      className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeSection === 'contact' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Contact
                    </button>
                    <div className="border-t pt-4 mt-2">
                      <Link href="/" className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <span className="italic">Powered by</span>
                        <img src={ppLogo.src} alt="PakPlay" className="h-6 w-auto" />
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Powered by - Desktop */}
              <Link href="/" className="hidden sm:flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors shrink-0">
                <span className="italic">Powered by</span>
                <img src={ppLogo.src} alt="PakPlay" className="h-6 sm:h-8 w-auto" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-[580px] md:h-[620px] overflow-hidden">
        <div className="absolute inset-0">
          {primaryPhoto ? (
            <img 
              src={primaryPhoto.photo_url} 
              alt={venue.name}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 h-full flex items-end pb-8 md:pb-12">
          <div className="text-white max-w-3xl">
             <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                  {venue.sport_type.charAt(0).toUpperCase() + venue.sport_type.slice(1)}
                </Badge>
               {averageRating > 0 && (
                 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                   <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                   <span className="font-semibold">{averageRating.toFixed(1)}</span>
                   <span className="text-sm">({reviews.length} reviews)</span>
                 </div>
               )}
             </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-1.5">{venue.name}</h1>
            
            {/* Tagline with glassy effect */}
            {(venue as any).tagline && (
              <p className="text-lg md:text-xl text-white mb-2 md:mb-3 font-light italic bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                "{(venue as any).tagline}"
              </p>
            )}
             {/* Pricing Section */}
             <div className="mb-2 flex flex-wrap items-end gap-3">
               {activeOffer ? (
                 <SpecialOfferBadge offer={activeOffer} originalPrice={venue.price_per_hour} />
               ) : (
                 <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-4 inline-block">
                   <p className="text-white/80 text-sm mb-1">Starting from</p>
                   <div className="text-3xl font-bold">
                     PKR {venue.price_per_hour.toLocaleString()}<span className="text-lg font-normal">/hour</span>
                   </div>
                 </div>
               )}
               {totalCourts > 0 && (
                 <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 inline-block">
                   <p className="text-white/80 text-sm mb-0.5">Courts</p>
                   <p className="text-lg font-semibold">{totalCourts} {totalCourts === 1 ? 'court' : 'courts'}</p>
                 </div>
               )}
             </div>
             
             {/* Social Links */}
             {((venue as any).facebook_url || (venue as any).instagram_url) && (
               <div className="flex flex-wrap items-center gap-2 md:gap-3">
                 {(venue as any).facebook_url && (
                   <a 
                     href={(venue as any).facebook_url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity"
                   >
                     <Facebook className="w-4 h-4 md:w-5 md:h-5 text-white" />
                   </a>
                 )}
                 {(venue as any).instagram_url && (
                   <a 
                     href={(venue as any).instagram_url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center hover:opacity-80 transition-opacity"
                   >
                     <Instagram className="w-4 h-4 md:w-5 md:h-5 text-white" />
                   </a>
                 )}
              </div>
             )}
          </div>
        </div>
      </section>

      {/* Loyalty Badge & Progress - Right after hero (hidden for venue owners) */}
      {loyaltyTiers.length > 0 && authChecked && !isOwner && (
        <div className="container mx-auto px-4 -mt-12 relative z-10">
          {/* Current Tier Badge */}
          {loyaltyStatus?.currentTier && currentUser && !isOwner && (() => {
            const getTierColor = (tierName: string) => {
              const name = tierName.toLowerCase();
              if (name.includes('silver')) return { bg: 'bg-gradient-to-br from-gray-100 to-gray-200', border: 'border-gray-300', text: 'text-gray-700', icon: 'text-gray-600', badge: 'bg-gray-500' };
              if (name.includes('gold')) return { bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', icon: 'text-yellow-600', badge: 'bg-yellow-500' };
              if (name.includes('platinum')) return { bg: 'bg-gradient-to-br from-purple-50 to-purple-100', border: 'border-purple-300', text: 'text-purple-800', icon: 'text-purple-600', badge: 'bg-purple-500' };
              return { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-300', text: 'text-blue-800', icon: 'text-blue-600', badge: 'bg-blue-500' };
            };
            const colors = getTierColor(loyaltyStatus.currentTier.tier_name);
            
            return (
              <Card className={`${colors.bg} border-2 ${colors.border} p-4 mb-4 shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${colors.badge} bg-opacity-20 flex items-center justify-center`}>
                      <Award className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${colors.text}`}>
                        {loyaltyStatus.currentTier.tier_name} Member
                      </h3>
                      <p className={`text-sm ${colors.text} opacity-70`}>Loyal Customer</p>
                    </div>
                  </div>
                  <div className={`${colors.badge} text-white px-4 py-2 rounded-full font-bold text-sm`}>
                    {loyaltyStatus.currentTier.discount_percent}% OFF
                  </div>
                </div>
                
                <div className={`border-t ${colors.border} pt-3 flex items-center justify-around`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${colors.text}`}>{loyaltyStatus.completedBookings}</p>
                    <p className={`text-xs ${colors.text} opacity-70`}>Bookings</p>
                  </div>
                  <div className={`w-px h-10 ${colors.border}`}></div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${colors.text}`}>{loyaltyStatus.currentTier.discount_percent}%</p>
                    <p className={`text-xs ${colors.text} opacity-70`}>Discount</p>
                  </div>
                  <div className={`w-px h-10 ${colors.border}`}></div>
                  <div className="text-center flex flex-col items-center">
                    <CheckCircle className={`w-5 h-5 ${colors.icon}`} />
                    <p className={`text-xs ${colors.text} opacity-70 mt-1`}>Active</p>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Progress to Next Tier */}
          {loyaltyStatus?.nextTier && currentUser && !isOwner && (() => {
            const remaining = loyaltyStatus.nextTier.min_bookings - loyaltyStatus.completedBookings;
            const progress = Math.min((loyaltyStatus.completedBookings / loyaltyStatus.nextTier.min_bookings) * 100, 100);
            const hasCurrentTier = !!loyaltyStatus.currentTier;
            
            return (
              <Card className="bg-white p-4 mb-4 shadow-lg relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full"></div>
                <div className="absolute -bottom-8 -left-4 w-16 h-16 bg-yellow-500/5 rounded-full"></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">
                        {hasCurrentTier ? `Upgrade to ${loyaltyStatus.nextTier.tier_name}` : 'Earn Rewards'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {remaining} more booking{remaining !== 1 ? 's' : ''} to go!
                      </p>
                    </div>
                  </div>
                  <div className="bg-yellow-500 text-white px-3 py-1.5 rounded-full font-bold text-xs">
                    {loyaltyStatus.nextTier.discount_percent}% OFF
                  </div>
                </div>
                
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Progress</span>
                    <span className="text-primary font-bold">
                      {loyaltyStatus.completedBookings}/{loyaltyStatus.nextTier.min_bookings}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>0</span>
                    <span>{loyaltyStatus.nextTier.min_bookings}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t relative z-10">
                  <div className="flex items-center gap-1.5 text-xs">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{loyaltyStatus.completedBookings} completed</span>
                  </div>
                  <div className="w-px h-4 bg-border"></div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-muted-foreground">{loyaltyStatus.nextTier.tier_name} at {loyaltyStatus.nextTier.min_bookings}</span>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Show program for non-logged-in users */}
          {!currentUser && (
            <Card className="bg-white p-4 mb-4 shadow-lg relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full"></div>
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Loyalty Rewards</h3>
                  <p className="text-sm text-muted-foreground">Sign in & book to earn discounts!</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 relative z-10">
                {loyaltyTiers.map((tier, i) => {
                  const getTierColor = (tierName: string) => {
                    const name = tierName.toLowerCase();
                    if (name.includes('silver')) return 'border-gray-400 text-gray-600 bg-gray-50';
                    if (name.includes('gold')) return 'border-yellow-400 text-yellow-600 bg-yellow-50';
                    if (name.includes('platinum')) return 'border-purple-400 text-purple-600 bg-purple-50';
                    return 'border-blue-400 text-blue-600 bg-blue-50';
                  };
                  const colorClass = getTierColor(tier.tier_name);
                  
                  return (
                    <div key={tier.id || i} className={`${colorClass} border rounded-lg p-2 text-center`}>
                      <Award className="w-4 h-4 mx-auto mb-1 opacity-70" />
                      <p className="font-semibold text-xs mb-0.5">{tier.tier_name}</p>
                      <p className="text-[10px] opacity-70">{tier.min_bookings} bookings</p>
                      <div className="mt-1 bg-white/50 rounded px-1.5 py-0.5">
                        <p className="text-[10px] font-bold">{tier.discount_percent}% off</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Ad Slot 1: Top Banner - After Hero */}
      <div className="container mx-auto px-4 mt-8">
        <AdBanner />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-10 sm:space-y-12 md:space-y-16">
            {/* About Section */}
            <section id="about" className="scroll-mt-24">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">About {venue.name}</h2>
              <div className="prose prose-base sm:prose-lg max-w-none">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {venue.description}
                </p>
              </div>
            </section>

            {/* Ad Slot 2: Native Ad - After About */}
            <AdNative />


            {/* Amenities Section */}
            <section id="amenities" className="scroll-mt-24">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Amenities & Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {venue.amenities && venue.amenities.length > 0 ? (
                  venue.amenities.map((amenity, index) => {
                    const amenityIcons: { [key: string]: any } = {
                      'WiFi': Wifi,
                      'Parking': Car,
                      'Changing Room': Droplets,
                      'Air Conditioning': Wind,
                      'Floodlights': Zap,
                      'Security': Shield,
                      'First Aid': Award
                    };
                    const IconComponent = amenityIcons[amenity] || CheckCircle;
                    
                    return (
                      <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                        <IconComponent className="w-8 h-8 text-blue-600 mb-3" />
                        <p className="font-medium">{amenity}</p>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground col-span-full">No amenities listed</p>
                )}
              </div>
            </section>

            {/* Gallery Section */}
            <section id="gallery" className="scroll-mt-24">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {venue.venue_photos.map((photo, index) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer">
                    <img 
                      src={photo.photo_url} 
                      alt={`${venue.name} - Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Ad Slot 3: Banner - Between Gallery and Reviews */}
            <AdBanner />

            {/* Reviews Section */}
            <section id="reviews" className="scroll-mt-24">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Customer Reviews</h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.slice(0, showAllReviews ? reviews.length : 3).map((review) => (
                    <Card key={review.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{review.customer_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.review_text}</p>
                      
                      {review.photo_urls && review.photo_urls.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-4">
                          {review.photo_urls.map((photo: string, photoIndex: number) => (
                            <img
                              key={photoIndex}
                              src={photo}
                              alt={`Review photo ${photoIndex + 1}`}
                              className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(photo, '_blank')}
                            />
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                  
                  {reviews.length > 3 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="w-full"
                    >
                      {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
              )}

              {/* Add Review Form - Only show if user is not the owner */}
              {!isOwner && (
              <Card className="p-4 sm:p-6 mt-6 sm:mt-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Leave a Review</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Your Name</Label>
                    <Input
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <Label>Rating</Label>
                    <div className="flex gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={`w-8 h-8 cursor-pointer transition-colors ${
                              star <= reviewRating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300 hover:text-yellow-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Your Review</Label>
                    <Textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience..."
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>Photos (Optional, max 5)</Label>
                    <div className="mt-2">
                      {reviewPhotoPreviews.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mb-4">
                          {reviewPhotoPreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square">
                              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded" />
                              <button
                                onClick={() => removeReviewPhoto(index)}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {reviewPhotos.length < 5 && (
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleReviewPhotoChange}
                            className="hidden"
                          />
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Add Photos</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Verify you&apos;re human</Label>
                    <div className="mt-2 min-h-[65px]">
                      <Turnstile
                        key={turnstileKey}
                        siteKey={TURNSTILE_SITE_KEY}
                        onSuccess={(token) => setCaptchaToken(token)}
                        onError={() => {
                          setCaptchaToken("");
                          setTurnstileKey((prev) => prev + 1);
                          toast.error("Captcha verification failed. Please try again.");
                        }}
                        onExpire={() => {
                          setCaptchaToken("");
                          setTurnstileKey((prev) => prev + 1);
                        }}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleReviewSubmit} 
                    disabled={submittingReview || !captchaToken}
                    className="w-full"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </Card>
              )}
            </section>

            {/* Google Maps Location Section */}
            {(venue as any).google_maps_url && (
              <section id="contact" className="scroll-mt-24">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  Find Us on Map
                </h2>
                <div className="relative w-full h-96 rounded-xl overflow-hidden bg-gray-100 border border-border">
                  <iframe
                    src={(venue as any).google_maps_url}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Venue Location Map"
                  />
                </div>
              </section>
            )}
          </div>

          {/* Booking Sidebar */}
          {authChecked && (
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 h-[calc(100vh-7rem)]">
              <Card id="booking" className="flex flex-col h-full p-2 scroll-mt-24 bg-blue-600 border-blue-600">
                <h3 className="text-lg font-bold mb-1 text-white shrink-0">
                  {isOwner ? "Book for Customer" : "Book Your Slot"}
                </h3>
                {isOwner && (
                  <p className="text-white/80 text-xs mb-2 shrink-0">
                    Enter customer details. WhatsApp opens to the customer&apos;s number after booking.
                  </p>
                )}
                
                {/* Show sign-in prompt if user is NOT logged in */}
                {!currentUser ? (
                  <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-2">Sign In Required</h4>
                    <p className="text-white/80 text-sm mb-6 leading-relaxed">
                      Please sign in to your account to book this venue
                    </p>
                    <Link href="/signin" className="w-full">
                      <Button className="w-full bg-white text-blue-600 hover:bg-white/90 font-bold">
                        Sign In to Book
                      </Button>
                    </Link>
                    <p className="text-white/70 text-xs mt-3">
                      Don't have an account?{' '}
                      <Link href="/signup" className="text-white underline font-medium">
                        Sign Up
                      </Link>
                    </p>
                  </div>
                ) : (
                  /* Booking form for logged-in users */
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Scrollable form content */}
                    <div className="flex-1 overflow-y-auto px-1 space-y-3 pb-2 booking-form-scrollbar">
                      <div className="space-y-2">
                        <Label className="text-white text-sm font-semibold mb-1 block">Booking Date</Label>
                        <Input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            if (selectedDate < today) {
                              toast.error("Please select a future date");
                              return;
                            }
                            setStartTime("");
                            setEndTime("");
                            setBookingDate(e.target.value);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="booking-date-input text-sm w-full h-10 pr-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                        />
                      </div>

                      <BookingTimeSlotGrid
                        bookingDate={bookingDate}
                        dayBookings={dayBookings}
                        totalCourts={totalCourts}
                        startTime={startTime}
                        endTime={endTime}
                        onChange={(start, end) => {
                          setStartTime(start);
                          setEndTime(end);
                        }}
                        loading={loadingDayBookings}
                        isOwner={isOwner}
                      />

                      <div className="space-y-2">
                        <Label className="text-white text-sm font-semibold mb-1 block">
                          {isOwner ? "Customer Name" : "Full Name"}
                        </Label>
                        <Input
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder={isOwner ? "Customer's full name" : "Enter your full name"}
                          className="text-sm w-full h-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white text-sm font-semibold mb-1 block">
                          {isOwner ? "Customer Phone" : "Phone Number"}
                        </Label>
                        <Input
                          value={playerPhone}
                          onChange={(e) => setPlayerPhone(e.target.value)}
                          placeholder="+92 300 1234567"
                          className="text-sm w-full h-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white text-sm font-semibold mb-1 block">
                          {isOwner ? "Customer Email" : "Email Address"}
                        </Label>
                        <Input
                          type="email"
                          value={playerEmail}
                          onChange={(e) => setPlayerEmail(e.target.value)}
                          placeholder={isOwner ? "customer@email.com" : "your@email.com"}
                          className="text-sm w-full h-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                          disabled={!!currentUser && !isOwner}
                        />
                      </div>

                      {/* Discount Selection — players only */}
                      {!isOwner && (activeOffer || (loyaltyStatus && loyaltyStatus.currentTier)) && (
                        <div className="space-y-2">
                          <Label className="text-white text-sm font-semibold mb-2 block">Apply Discount</Label>
                          <div className="space-y-2">
                            {activeOffer && (
                              <div
                                onClick={() => setSelectedDiscount(selectedDiscount === 'offer' ? null : 'offer')}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedDiscount === 'offer'
                                    ? 'bg-white border-white shadow-lg'
                                    : 'bg-white/10 border-white/30 hover:bg-white/20 hover:border-white/50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                      selectedDiscount === 'offer' ? 'border-blue-600 bg-blue-600' : 'border-white'
                                    }`}>
                                      {selectedDiscount === 'offer' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                      )}
                                    </div>
                                    <span className={`text-sm font-semibold ${
                                      selectedDiscount === 'offer' ? 'text-blue-600' : 'text-white'
                                    }`}>
                                      {activeOffer.offer_name}
                                    </span>
                                  </div>
                                  <span className={`text-sm font-bold ${
                                    selectedDiscount === 'offer' ? 'text-blue-600' : 'text-white'
                                  }`}>
                                    PKR {activeOffer.offer_price}/hr
                                  </span>
                                </div>
                              </div>
                            )}

                            {loyaltyStatus && loyaltyStatus.currentTier && (
                              <div
                                onClick={() => setSelectedDiscount(selectedDiscount === 'loyalty' ? null : 'loyalty')}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedDiscount === 'loyalty'
                                    ? 'bg-white border-white shadow-lg'
                                    : 'bg-white/10 border-white/30 hover:bg-white/20 hover:border-white/50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                      selectedDiscount === 'loyalty' ? 'border-blue-600 bg-blue-600' : 'border-white'
                                    }`}>
                                      {selectedDiscount === 'loyalty' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                      )}
                                    </div>
                                    <span className={`text-sm font-semibold ${
                                      selectedDiscount === 'loyalty' ? 'text-blue-600' : 'text-white'
                                    }`}>
                                      {loyaltyStatus.currentTier.tier_name} Loyalty
                                    </span>
                                  </div>
                                  <span className={`text-sm font-bold ${
                                    selectedDiscount === 'loyalty' ? 'text-blue-600' : 'text-white'
                                  }`}>
                                    {loyaltyStatus.currentTier.discount_percent}% OFF
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sticky footer with price and button */}
                    <div className="shrink-0 border-t border-white/20 pt-3 mt-2 bg-blue-600">
                      {bookingDate && startTime && endTime && (
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30 mb-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-white text-sm">Total Price:</span>
                            <span className="text-lg font-bold text-white">PKR {calculateTotalPrice().toLocaleString()}</span>
                          </div>
                          {selectedDiscount === 'offer' && activeOffer && (
                            <p className="text-xs text-white/90 mt-1.5">✨ Special offer applied!</p>
                          )}
                          {selectedDiscount === 'loyalty' && loyaltyStatus?.currentTier && (
                            <p className="text-xs text-white/90 mt-1.5">
                              ✨ {loyaltyStatus.currentTier.tier_name} loyalty discount applied!
                            </p>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleBooking}
                        disabled={
                          submitting ||
                          loadingDayBookings ||
                          !bookingDate ||
                          !startTime ||
                          !endTime ||
                          !playerName ||
                          !playerPhone ||
                          !playerEmail ||
                          calculateTotalHours() <= 0 ||
                          (courtAvailability !== null && !courtAvailability.available)
                        }
                        className="w-full bg-white text-blue-600 hover:bg-white/90 font-bold h-11 text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isOwner ? (
                          <>
                            Save &amp; Message Customer
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            Book via WhatsApp
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                      
                      <p className="text-xs text-white/80 text-center mt-2 leading-tight">
                        {isOwner
                          ? "WhatsApp will open to the customer's number with booking details"
                          : "You'll be redirected to WhatsApp to confirm your booking"}
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Ad Slot 4: Sidebar Rectangle - Sticky */}
              <div className="mt-4 hidden lg:block">
                <AdRectangle />
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Ad Slot 5: Bottom Banner - Before Footer */}
      <div className="container mx-auto px-4 mb-8">
        <AdBanner />
      </div>

      {/* Professional Footer */}
      <footer className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Venue Info */}
            <div className="md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {(venue as any).logo_url && (
                  <img 
                    src={(venue as any).logo_url} 
                    alt={venue.name}
                    className="h-12 w-12 object-contain rounded-full border border-white/30 p-1 bg-white/10"
                  />
                )}
                <h3 className="text-2xl font-bold text-white">{venue.name}</h3>
              </div>
              <p className="text-white/90 leading-relaxed">
                {venue.description?.substring(0, 150)}...
              </p>
            </div>

            {/* Operating Hours */}
            <div>
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-white" />
                Opening Hours
              </h4>
              <div className="space-y-2">
                {venue.is_24_7 ? (
                  <>
                    <p className="text-3xl font-bold text-white">24/7</p>
                    <p className="text-white/80 text-sm">Open all day, every day</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-white">
                      {formatTime(venue.opening_time)} - {formatTime(venue.closing_time)}
                    </p>
                    <p className="text-white/80 text-sm">Daily Schedule</p>
                  </>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Phone className="w-5 h-5 text-white" />
                Contact Us
              </h4>
              <div className="space-y-3">
                <a 
                  href={`tel:${venue.whatsapp_number}`}
                  className="flex items-start gap-3 text-white/90 hover:text-white transition-colors group"
                >
                  <Phone className="w-5 h-5 mt-0.5 text-white group-hover:text-white/80 shrink-0" />
                  <span>{venue.whatsapp_number}</span>
                </a>
                
                {ownerEmail && (
                  <a 
                    href={`mailto:${ownerEmail}`}
                    className="flex items-start gap-3 text-white/90 hover:text-white transition-colors group"
                  >
                    <svg className="w-5 h-5 mt-0.5 text-white group-hover:text-white/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="break-all">{ownerEmail}</span>
                  </a>
                )}
                
                <a 
                  href={`https://wa.me/${formatWhatsAppNumber(venue.whatsapp_number)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Message on WhatsApp
                </a>
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5 text-white" />
                Visit Us
              </h4>
              <p className="text-white leading-relaxed">
                {venue.address}
                {(venue as any).area || venue.city ? ', ' : ''}
                {formatFullLocation((venue as any).province, venue.city, (venue as any).area, (venue as any).sub_area) || venue.city}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
