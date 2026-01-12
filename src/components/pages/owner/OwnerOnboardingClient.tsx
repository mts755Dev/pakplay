"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building, MapPin, DollarSign, Phone, Clock, Image, Upload, X, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LocationSelector } from "@/components/LocationSelector";
import { formatFullLocation } from "@/lib/locationHelpers";
import ppLogo from "@/assets/pp logo.png";

export function OwnerOnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreivews, setPhotoPreivews] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]); // Store URLs directly
  const [imageUrl, setImageUrl] = useState(""); // Input for pasting URLs
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    venueName: "",
    sport: "",
    province: "",
    city: "",
    area: "",
    subArea: "",
    address: "",
    pricePerHour: "",
    phone: "",
    openingTime: "",
    closingTime: "",
    is24_7: false,
    description: "",
    amenities: [] as string[],
    // Branding & customization
    tagline: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    websiteUrl: "",
    videoUrl: "",
    yearsInBusiness: "",
    totalCustomers: "",
    googleMapsUrl: "",
  });

  // Dynamic pricing rules state
  const [pricingRules, setPricingRules] = useState<Array<{
    daysOfWeek: string[]; // Changed to array for multiple days
    startTime: string;
    endTime: string;
    price: string;
  }>>([]);

  // Custom amenity input
  const [customAmenity, setCustomAmenity] = useState("");
  
  // Customization states
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Common amenities and features preset list  
  const commonAmenities = [
    "Parking",
    "Changing Rooms",
    "Showers",
    "Restrooms",
    "WiFi",
    "Air Conditioning",
    "Floodlights",
    "CCTV Security",
    "First Aid",
    "Equipment Rental",
    "Lockers",
    "Seating Area",
    "Cafeteria",
    "Water Fountain"
  ];

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to list a venue");
      router.push('/signin');
      return;
    }
    setUser(user);
  };


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const totalPhotos = photos.length + photoUrls.length;
    if (totalPhotos + files.length > 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }

    setPhotos([...photos, ...files]);

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreivews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    const totalPhotos = photos.length + photoUrls.length;
    if (totalPhotos >= 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }

    // Add URL to both photoUrls and photoPreivews
    setPhotoUrls([...photoUrls, imageUrl]);
    setPhotoPreivews(prev => [...prev, imageUrl]);
    setImageUrl(""); // Clear input
    toast.success("Image URL added");
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB");
      return;
    }

    setLogo(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview("");
  };


  const removePhoto = (index: number) => {
    // Determine if this is a file or URL
    const fileCount = photos.length;
    
    if (index < fileCount) {
      // Remove from files
      setPhotos(photos.filter((_, i) => i !== index));
    } else {
      // Remove from URLs
      const urlIndex = index - fileCount;
      setPhotoUrls(photoUrls.filter((_, i) => i !== urlIndex));
    }
    
    setPhotoPreivews(photoPreivews.filter((_, i) => i !== index));
  };

  const uploadLogo = async (userId: string) => {
    if (!logo) return null;

    const fileExt = logo.name.split('.').pop();
    const fileName = `${userId}/logo_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('venue-logos')
      .upload(fileName, logo);

    if (error) {
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venue-logos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const uploadPhotos = async (venueId: string, userId: string) => {
    const uploadedUrls: string[] = [];

    // Upload files
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileExt = photo.name.split('.').pop();
      const fileName = `${userId}/${venueId}/${Date.now()}_${i}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('venue-photos')
        .upload(fileName, photo);

      if (error) {
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('venue-photos')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    // Add URL-based photos (no upload needed)
    uploadedUrls.push(...photoUrls);

    return uploadedUrls;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    const totalPhotos = photos.length + photoUrls.length;
    if (totalPhotos < 1) {
      toast.error("Please add at least 1 photo (upload file or paste image URL)");
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      // Generate slug
      const baseSlug = generateSlug(formData.venueName);
      
      // Use the database function to get unique slug (with fallback)
      let slug = baseSlug;
      try {
        const { data: slugData, error: slugError } = await supabase
          .rpc('generate_venue_slug', { venue_name: formData.venueName });
        
        if (!slugError && slugData) {
          slug = slugData;
        }
      } catch (e) {
      }

      // Upload logo first
      const logoUrl = await uploadLogo(user.id);

      // Insert venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          owner_id: user.id,
          name: formData.venueName,
          slug: slug,
          sport_type: formData.sport,
          province: formData.province || null,
          city: formData.city,
          area: formData.area || null,
          sub_area: formData.subArea || null,
          address: formData.address,
          description: formData.description,
          amenities: formData.amenities.length > 0 ? formData.amenities : null,
          price_per_hour: parseFloat(formData.pricePerHour),
          opening_time: formData.is24_7 ? null : formData.openingTime,
          closing_time: formData.is24_7 ? null : formData.closingTime,
          is_24_7: formData.is24_7,
          whatsapp_number: formData.phone,
          status: 'pending',
          // Customization fields
          logo_url: logoUrl,
          tagline: formData.tagline || null,
          facebook_url: formData.facebookUrl || null,
          instagram_url: formData.instagramUrl || null,
          twitter_url: formData.twitterUrl || null,
          website_url: formData.websiteUrl || null,
          video_url: formData.videoUrl || null,
          years_in_business: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness) : null,
          total_customers: formData.totalCustomers ? parseInt(formData.totalCustomers) : null,
          google_maps_url: formData.googleMapsUrl || null,
        })
        .select()
        .single();

      if (venueError) throw venueError;

      // Upload photos
      const photoUrls = await uploadPhotos(venue.id, user.id);

      // Insert venue photos
      if (photoUrls.length > 0) {
        const photoInserts = photoUrls.map((url, index) => ({
          venue_id: venue.id,
          photo_url: url,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: photoError } = await supabase
          .from('venue_photos')
          .insert(photoInserts);

        if (photoError) {
        }
      }

      // Insert pricing rules if any
      if (pricingRules.length > 0) {
        const pricingInserts: any[] = [];
        
        pricingRules.forEach((rule, index) => {
          if (rule.daysOfWeek.length === 0) {
            // Apply to all days
            pricingInserts.push({
              venue_id: venue.id,
              day_of_week: null,
              start_time: rule.startTime || null,
              end_time: rule.endTime || null,
              price_per_hour: parseFloat(rule.price),
              priority: index,
            });
          } else {
            // Create separate rule for each selected day
            rule.daysOfWeek.forEach(day => {
              pricingInserts.push({
                venue_id: venue.id,
                day_of_week: parseInt(day),
                start_time: rule.startTime || null,
                end_time: rule.endTime || null,
                price_per_hour: parseFloat(rule.price),
                priority: index,
              });
            });
          }
        });

        if (pricingInserts.length > 0) {
          const { error: pricingError } = await supabase
            .from('venue_pricing_rules')
            .insert(pricingInserts);

          if (pricingError) {
          }
        }
      }

      toast.success("Venue submitted for approval! We'll review it within 24 hours.");
      
      // Navigate to owner dashboard
      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || "Failed to submit venue");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.venueName || !formData.sport || !formData.city || !formData.address) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    if (step === 2) {
      if (!formData.pricePerHour || !formData.phone) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (!formData.is24_7 && (!formData.openingTime || !formData.closingTime)) {
        toast.error("Please set opening and closing times or enable 24/7 operation");
        return;
      }
    }
    setStep(step + 1);
  };

  const addPricingRule = () => {
    setPricingRules([...pricingRules, {
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      price: formData.pricePerHour
    }]);
  };

  const removePricingRule = (index: number) => {
    setPricingRules(pricingRules.filter((_, i) => i !== index));
  };

  const updatePricingRule = (index: number, field: string, value: any) => {
    const updated = [...pricingRules];
    updated[index] = { ...updated[index], [field]: value };
    setPricingRules(updated);
  };

  const toggleDayInRule = (ruleIndex: number, day: string) => {
    const rule = pricingRules[ruleIndex];
    const newDays = rule.daysOfWeek.includes(day)
      ? rule.daysOfWeek.filter(d => d !== day)
      : [...rule.daysOfWeek, day];
    updatePricingRule(ruleIndex, 'daysOfWeek', newDays);
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter(a => a !== amenity)
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity]
      });
    }
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, customAmenity.trim()]
      });
      setCustomAmenity("");
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenity)
    });
  };

  // If not authenticated, redirect handled in checkUser
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src={ppLogo.src} alt="PakPlay" className="h-12 w-auto" />
          </Link>
          <div className="flex gap-2">
            <Link href="/owner/dashboard">
              <Button variant="ghost">My Dashboard</Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-foreground">List Your Venue</h1>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>
            <p className="text-muted-foreground">Step {step} of 3</p>
          </div>

          <Card className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Basic Information</h2>
                  <p className="text-muted-foreground">Tell us about your venue</p>
                </div>

                <div>
                  <Label htmlFor="venueName" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Venue Name *
                  </Label>
                  <Input 
                    id="venueName" 
                    placeholder="e.g., Elite Padel Club"
                    value={formData.venueName}
                    onChange={(e) => setFormData({...formData, venueName: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="sport">Sport Type *</Label>
                  <Select value={formData.sport} onValueChange={(value) => setFormData({...formData, sport: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background max-h-[300px]">
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="cricket">Cricket</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="badminton">Badminton</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="table-tennis">Table Tennis</SelectItem>
                      <SelectItem value="squash">Squash</SelectItem>
                      <SelectItem value="padel">Padel</SelectItem>
                      <SelectItem value="futsal">Futsal</SelectItem>
                      <SelectItem value="hockey">Hockey</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="boxing">Boxing</SelectItem>
                      <SelectItem value="martial-arts">Martial Arts</SelectItem>
                      <SelectItem value="gym">Gym / Fitness</SelectItem>
                      <SelectItem value="snooker">Snooker</SelectItem>
                      <SelectItem value="golf">Golf</SelectItem>
                      <SelectItem value="kabaddi">Kabaddi</SelectItem>
                      <SelectItem value="athletics">Athletics</SelectItem>
                      <SelectItem value="cycling">Cycling</SelectItem>
                      <SelectItem value="multi-sport">Multi-Sport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <LocationSelector
                    onLocationChange={(location) => {
                      setFormData({
                        ...formData,
                        province: location.province || "",
                        city: location.city || "",
                        area: location.area || "",
                        subArea: location.subArea || "",
                      });
                    }}
                    initialProvince={formData.province}
                    initialCity={formData.city}
                    initialArea={formData.area}
                    initialSubArea={formData.subArea}
                    required={true}
                    showAllLevels={true}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Complete Address *</Label>
                  <Textarea 
                    id="address" 
                    placeholder="Enter full address with landmarks"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Pricing & Hours</h2>
                  <p className="text-muted-foreground">Set your rates and availability</p>
                </div>

                <div>
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Base Price per Hour (PKR) *
                  </Label>
                  <Input 
                    id="price" 
                    type="number" 
                    min="0"
                    step="100"
                    placeholder="e.g., 2500"
                    value={formData.pricePerHour}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value < 0) return;
                      setFormData({...formData, pricePerHour: e.target.value});
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Default price when no special rates apply
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    WhatsApp Number *
                  </Label>
                  <Input 
                    id="phone" 
                    placeholder="+92 300 0000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Booking requests will be sent to this number
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="is24_7"
                      checked={formData.is24_7}
                      onCheckedChange={(checked) => setFormData({...formData, is24_7: checked as boolean})}
                    />
                    <Label 
                      htmlFor="is24_7" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Open 24/7
                    </Label>
                  </div>

                  {!formData.is24_7 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="openingTime" className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Opening Time *
                        </Label>
                        <Input 
                          id="openingTime" 
                          type="time"
                          value={formData.openingTime}
                          onChange={(e) => setFormData({...formData, openingTime: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="closingTime">Closing Time *</Label>
                        <Input 
                          id="closingTime" 
                          type="time"
                          value={formData.closingTime}
                          onChange={(e) => setFormData({...formData, closingTime: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Dynamic Pricing (Optional)</h3>
                      <p className="text-sm text-muted-foreground">Set different prices for specific days/times</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addPricingRule}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>

                  {pricingRules.map((rule, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Rule {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePricingRule(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div>
                        <Label className="text-xs mb-2">Select Days (Choose one or more)</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {[
                            { value: '1', label: 'Mon' },
                            { value: '2', label: 'Tue' },
                            { value: '3', label: 'Wed' },
                            { value: '4', label: 'Thu' },
                            { value: '5', label: 'Fri' },
                            { value: '6', label: 'Sat' },
                            { value: '0', label: 'Sun' },
                          ].map((day) => (
                            <div
                              key={day.value}
                              onClick={() => toggleDayInRule(index, day.value)}
                              className={`
                                flex items-center justify-center py-2 px-3 rounded-md cursor-pointer border-2 transition-all
                                ${rule.daysOfWeek.includes(day.value)
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-border hover:border-primary/50'
                                }
                              `}
                            >
                              <span className="text-xs font-medium">{day.label}</span>
                            </div>
                          ))}
                        </div>
                        {rule.daysOfWeek.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            No days selected = applies to all days
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Start Time (Optional)</Label>
                          <Input
                            type="time"
                            className="h-9"
                            value={rule.startTime}
                            onChange={(e) => updatePricingRule(index, 'startTime', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Time (Optional)</Label>
                          <Input
                            type="time"
                            className="h-9"
                            value={rule.endTime}
                            onChange={(e) => updatePricingRule(index, 'endTime', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Price (PKR) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          className="h-9"
                          placeholder="e.g., 3000"
                          value={rule.price}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value < 0) return;
                            updatePricingRule(index, 'price', e.target.value);
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {pricingRules.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pricing rules added. Using base price for all times.
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => setStep(1)} variant="outline" className="w-full">
                    Back
                  </Button>
                  <Button onClick={handleNext} className="w-full">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Details & Photos</h2>
                  <p className="text-muted-foreground">Make your venue stand out</p>
                </div>

                <div>
                  <Label htmlFor="description">Venue Description *</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your venue, facilities, and what makes it special..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Amenities & Features</Label>
                  <p className="text-xs text-muted-foreground mb-2">Select all facilities and features available at your venue</p>
                  <div className="border rounded-lg p-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-3">Available Options</p>
                      <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                        {commonAmenities.map((amenity) => (
                          <div key={amenity} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`amenity-${amenity}`}
                              checked={formData.amenities.includes(amenity)}
                              onCheckedChange={() => toggleAmenity(amenity)}
                            />
                            <Label 
                              htmlFor={`amenity-${amenity}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {amenity}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Add Custom Amenity</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Outdoor Seating"
                          value={customAmenity}
                          onChange={(e) => setCustomAmenity(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomAmenity();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addCustomAmenity}
                          disabled={!customAmenity.trim()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {formData.amenities.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Selected Amenities:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.amenities.map((amenity) => (
                            <div
                              key={amenity}
                              className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                            >
                              <span>{amenity}</span>
                              <button
                                type="button"
                                onClick={() => removeAmenity(amenity)}
                                className="hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <Label>Business Logo (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-3">Upload your venue's logo for branding (max 2MB)</p>
                  
                  {logoPreview && (
                    <div className="mb-4">
                      <div className="relative inline-block">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview"
                          className="w-32 h-32 object-contain rounded-lg border-2 border-border"
                        />
                        <button
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {!logoPreview && (
                    <label className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload logo</p>
                    </label>
                  )}
                </div>

                {/* Tagline */}
                <div>
                  <Label htmlFor="tagline">Business Tagline (Optional)</Label>
                  <Input 
                    id="tagline" 
                    placeholder="e.g., Pakistan's Premier Football Arena"
                    value={formData.tagline}
                    onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                  />
                </div>

                {/* Business Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsInBusiness">Years in Business (Optional)</Label>
                    <Input 
                      id="yearsInBusiness"
                      type="number"
                      min="0"
                      placeholder="e.g., 5"
                      value={formData.yearsInBusiness}
                      onChange={(e) => setFormData({...formData, yearsInBusiness: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalCustomers">Total Customers Served (Optional)</Label>
                    <Input 
                      id="totalCustomers"
                      type="number"
                      min="0"
                      placeholder="e.g., 5000"
                      value={formData.totalCustomers}
                      onChange={(e) => setFormData({...formData, totalCustomers: e.target.value})}
                    />
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">YouTube or Vimeo video link to showcase your venue</p>
                  <Input 
                    id="videoUrl" 
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                  />
                </div>

                {/* Google Maps URL */}
                <div>
                  <Label htmlFor="googleMapsUrl">Google Maps Location (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Display an interactive map on your venue page</p>
                  <Input 
                    id="googleMapsUrl" 
                    type="url"
                    placeholder="Paste full iframe code or just the URL..."
                    value={formData.googleMapsUrl}
                    onChange={(e) => {
                      let value = e.target.value.trim();
                      // Extract URL from iframe code if pasted
                      const srcMatch = value.match(/src=["']([^"']+)["']/);
                      if (srcMatch) {
                        value = srcMatch[1];
                      }
                      setFormData({...formData, googleMapsUrl: value});
                    }}
                  />
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">✅ Simple Steps:</p>
                    <ol className="text-xs text-green-800 dark:text-green-200 space-y-1 ml-4 list-decimal">
                      <li>Go to <span className="font-mono bg-green-100 dark:bg-green-900 px-1 rounded">maps.google.com</span></li>
                      <li>Search for your venue location</li>
                      <li>Click <strong>"Share"</strong> button</li>
                      <li>Click <strong>"Embed a map"</strong> tab</li>
                      <li><strong>Copy and paste the entire code</strong> - we'll extract the URL automatically! 🎉</li>
                    </ol>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">💡 You can paste the full iframe code or just the URL - both work!</p>
                  </div>
                </div>

                {/* Social Media Links */}
                <div>
                  <Label>Social Media & Website (Optional)</Label>
                  <div className="space-y-3 mt-2">
                    <Input 
                      type="url"
                      placeholder="Facebook Page URL"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData({...formData, facebookUrl: e.target.value})}
                    />
                    <Input 
                      type="url"
                      placeholder="Instagram Profile URL"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})}
                    />
                    <Input 
                      type="url"
                      placeholder="Twitter Profile URL"
                      value={formData.twitterUrl}
                      onChange={(e) => setFormData({...formData, twitterUrl: e.target.value})}
                    />
                    <Input 
                      type="url"
                      placeholder="Website URL"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4" />
                    Venue Photos (At least 1 required) *
                  </Label>
                  
                  {/* Photo Previews */}
                  {photoPreivews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {photoPreivews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Method Toggle */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={uploadMethod === 'file' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadMethod('file')}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMethod === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadMethod('url')}
                      className="flex-1"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Paste URL
                    </Button>
                  </div>

                  {/* Upload Method: File */}
                  {uploadMethod === 'file' && (
                    <label className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer block">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                        disabled={uploading}
                      />
                      <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">Click to upload photos</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {photos.length + photoUrls.length}/10 photos • JPG, PNG, WEBP (max 5MB each)
                      </p>
                    </label>
                  )}

                  {/* Upload Method: URL */}
                  {uploadMethod === 'url' && (
                    <div className="border-2 border-dashed border-border rounded-lg p-6">
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="Paste image URL (e.g., https://example.com/image.jpg)"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImageUrl();
                            }
                          }}
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          onClick={handleAddImageUrl}
                          disabled={uploading || !imageUrl.trim()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 text-center">
                        {photos.length + photoUrls.length}/10 photos • Paste direct image URLs
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        💡 Tip: Right-click on any image → "Copy image address" → Paste here
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => setStep(2)} variant="outline" className="w-full" disabled={loading}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    disabled={loading || uploading || (photos.length + photoUrls.length) < 1}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {uploading ? 'Uploading photos...' : 'Submitting...'}
                      </>
                    ) : (
                      'Submit for Approval'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Info Card */}
          <Card className="mt-6 p-6 bg-accent/5 border-accent/20">
            <h3 className="font-bold mb-2 text-foreground">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Our team will review your venue within 24 hours</li>
              <li>✓ Once approved, your venue goes live on PakPlay</li>
              <li>✓ You'll receive a unique link: pakplay.co/venue/your-venue-name</li>
              <li>✓ Start receiving bookings via WhatsApp instantly</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

