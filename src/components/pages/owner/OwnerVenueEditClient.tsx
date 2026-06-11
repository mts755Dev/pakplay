"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building, MapPin, DollarSign, Phone, Clock, Image, Upload, X, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LocationSelector } from "@/components/LocationSelector";
import { uploadVenueLogo, uploadVenuePhotos } from "@/lib/file-utils";
import {
  fetchVenueLoyaltyTiers,
  updateOwnerVenue,
} from "@/lib/server-actions";

interface OwnerVenueEditClientProps {
  venueId: string;
  initialVenue: any;
  userId: string;
}

export function OwnerVenueEditClient({ venueId, initialVenue, userId }: OwnerVenueEditClientProps) {
  console.log("Rendering OwnerVenueEditClient - Loyalty Tiers:", initialVenue?.venue_loyalty_tiers);
  const router = useRouter();
  const id = venueId;
  // Use initial venue data from server - no loading needed!
  const [venue] = useState<any>(initialVenue);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]); // Store URLs directly
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState(""); // Input for pasting URLs
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [formData, setFormData] = useState({
    venueName: "",
    sport: "",
    province: "",
    city: "",
    area: "",
    subArea: "",
    address: "",
    pricePerHour: "",
    numberOfCourts: "1",
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
    googleMapsUrl: "",
  });

  const [pricingRules, setPricingRules] = useState<Array<{
    id?: string;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    price: string;
  }>>([]);

  const [loyaltyTiers, setLoyaltyTiers] = useState<Array<{
    tier_name: string;
    min_bookings: string;
    discount_percent: string;
  }>>([]);

  const [customAmenity, setCustomAmenity] = useState("");

  const commonAmenities = [
    "Parking", "Changing Rooms", "Showers", "Restrooms", "Water Fountain",
    "Equipment Rental", "Lockers", "Cafeteria", "First Aid", "Lighting",
    "Seating Area", "Air Conditioning", "WiFi"
  ];

  // Initialize form with venue data from server
  useEffect(() => {
    try {
      if (initialVenue) {
        setExistingPhotos(initialVenue.venue_photos || []);
        
        // Set logo preview if exists
        if (initialVenue.logo_url) {
          setLogoPreview(initialVenue.logo_url);
        }

        // Populate form data
        setFormData({
          venueName: initialVenue.name || "",
          sport: initialVenue.sport_type || "",
          province: initialVenue.province || "",
          city: initialVenue.city || "",
          area: initialVenue.area || "",
          subArea: initialVenue.sub_area || "",
          address: initialVenue.address || "",
          pricePerHour: initialVenue.price_per_hour?.toString() || "",
          numberOfCourts: initialVenue.number_of_courts?.toString() || "1",
          phone: initialVenue.whatsapp_number || "",
          openingTime: initialVenue.opening_time || "",
          closingTime: initialVenue.closing_time || "",
          is24_7: initialVenue.is_24_7 || false,
          description: initialVenue.description || "",
          amenities: initialVenue.amenities || [],
          // Branding & customization
          tagline: initialVenue.tagline || "",
          facebookUrl: initialVenue.facebook_url || "",
          instagramUrl: initialVenue.instagram_url || "",
          googleMapsUrl: initialVenue.google_maps_url || "",
        });

        // Populate pricing rules
        if (initialVenue.venue_pricing_rules && initialVenue.venue_pricing_rules.length > 0) {
          const rules = initialVenue.venue_pricing_rules.reduce((acc: any[], rule: any) => {
            // Group rules by priority
            const existingRule = acc.find(r => r.priority === rule.priority);
            if (existingRule) {
              if (rule.day_of_week !== null) {
                existingRule.daysOfWeek.push(rule.day_of_week.toString());
              }
            } else {
              acc.push({
                id: rule.id,
                priority: rule.priority,
                daysOfWeek: rule.day_of_week !== null ? [rule.day_of_week.toString()] : [],
                startTime: rule.start_time || "",
                endTime: rule.end_time || "",
                price: rule.price_per_hour?.toString() || "",
              });
            }
            return acc;
          }, []);
          setPricingRules(rules);
        }

        // Load loyalty tiers
        fetchVenueLoyaltyTiers(initialVenue.id).then(tiers => {
          console.log('[OwnerVenueEdit] Loaded loyalty tiers:', tiers);
          if (tiers.length > 0) {
            setLoyaltyTiers(tiers.map(t => ({
              tier_name: t.tier_name,
              min_bookings: t.min_bookings.toString(),
              discount_percent: t.discount_percent.toString(),
            })));
          } else {
            console.log('[OwnerVenueEdit] No loyalty tiers found, section should still be visible');
          }
        }).catch(err => {
          console.error('[OwnerVenueEdit] Error loading loyalty tiers:', err);
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load venue");
      router.push('/owner/dashboard');
    }
  }, [initialVenue]);

  // Debug: Log when loyaltyTiers changes
  useEffect(() => {
    console.log('[OwnerVenueEdit] loyaltyTiers state:', loyaltyTiers);
    console.log('[OwnerVenueEdit] Loyalty Program section should be visible');
  }, [loyaltyTiers]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const totalPhotos = existingPhotos.length - photosToDelete.length + newPhotos.length + newPhotoUrls.length + files.length;
    if (totalPhotos > 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }

    setNewPhotos([...newPhotos, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoPreviews(prev => [...prev, reader.result as string]);
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

    const totalPhotos = existingPhotos.length - photosToDelete.length + newPhotos.length + newPhotoUrls.length;
    if (totalPhotos >= 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }

    // Add URL to both newPhotoUrls and newPhotoPreviews
    setNewPhotoUrls([...newPhotoUrls, imageUrl]);
    setNewPhotoPreviews(prev => [...prev, imageUrl]);
    setImageUrl(""); // Clear input
    toast.success("Image URL added");
  };

  const removeExistingPhoto = (photoId: string) => {
    setPhotosToDelete([...photosToDelete, photoId]);
  };

  const removeNewPhoto = (index: number) => {
    // Determine if this is a file or URL
    const fileCount = newPhotos.length;
    
    if (index < fileCount) {
      // Remove from files
      setNewPhotos(newPhotos.filter((_, i) => i !== index));
    } else {
      // Remove from URLs
      const urlIndex = index - fileCount;
      setNewPhotoUrls(newPhotoUrls.filter((_, i) => i !== urlIndex));
    }
    
    setNewPhotoPreviews(newPhotoPreviews.filter((_, i) => i !== index));
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

  const handleSave = async () => {
    if (!venue) return;

    if (!formData.venueName || !formData.sport || !formData.city || !formData.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    const numberOfCourts = parseInt(formData.numberOfCourts, 10);
    if (!Number.isFinite(numberOfCourts) || numberOfCourts < 1) {
      toast.error("Please enter at least 1 court");
      return;
    }

    const remainingPhotos = existingPhotos.filter(p => !photosToDelete.includes(p.id)).length;
    const totalPhotos = remainingPhotos + newPhotos.length + newPhotoUrls.length;
    
    if (totalPhotos < 1) {
      toast.error("Please keep at least 1 photo");
      return;
    }

    setSaving(true);
    setUploading(newPhotos.length > 0 || newPhotoUrls.length > 0);

    try {
      let logoUrl: string | null = logoPreview || null;
      if (logo) {
        const logoResult = await uploadVenueLogo(userId, id, logo);
        if (logoResult.url) {
          logoUrl = logoResult.url;
        } else if (logoResult.error) {
          console.error('Logo upload error:', logoResult.error);
        }
      }

      let uploadedPhotoUrls: string[] = [...newPhotoUrls];
      if (newPhotos.length > 0) {
        const photoResult = await uploadVenuePhotos(userId, id, newPhotos);
        if (photoResult.error) {
          toast.error(photoResult.error);
          return;
        }
        uploadedPhotoUrls = [...uploadedPhotoUrls, ...photoResult.urls];
      }

      const validTiers = loyaltyTiers.filter(
        (t) => t.tier_name.trim() && parseInt(t.min_bookings) > 0 && parseFloat(t.discount_percent) > 0
      );

      const result = await updateOwnerVenue(
        userId,
        id,
        {
          name: formData.venueName,
          sport_type: formData.sport as 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel',
          province: formData.province || null,
          city: formData.city,
          area: formData.area || null,
          sub_area: formData.subArea || null,
          address: formData.address,
          description: formData.description,
          amenities: formData.amenities.length > 0 ? formData.amenities : null,
          price_per_hour: parseFloat(formData.pricePerHour),
          number_of_courts: numberOfCourts,
          opening_time: formData.is24_7 ? null : formData.openingTime,
          closing_time: formData.is24_7 ? null : formData.closingTime,
          is_24_7: formData.is24_7,
          whatsapp_number: formData.phone,
          logo_url: logoUrl,
          tagline: formData.tagline || null,
          facebook_url: formData.facebookUrl || null,
          instagram_url: formData.instagramUrl || null,
          google_maps_url: formData.googleMapsUrl || null,
        },
        {
          photosToDelete,
          newPhotoUrls: uploadedPhotoUrls,
          remainingPhotoCount: remainingPhotos,
          pricingRules,
          loyaltyTiers: validTiers.map((t) => ({
            tier_name: t.tier_name.trim(),
            min_bookings: parseInt(t.min_bookings),
            discount_percent: parseFloat(t.discount_percent),
          })),
        }
      );

      if (!result.success) {
        toast.error(result.error || "Failed to update venue");
        return;
      }

      toast.success("Venue updated successfully!");
      router.push('/owner/venues');
    } catch (error: any) {
      toast.error(error.message || "Failed to update venue");
    } finally {
      setSaving(false);
      setUploading(false);
    }
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

  if (!venue) return null;

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="owner" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/owner/venues')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Venues
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Venue</h1>
              <p className="text-muted-foreground mt-1">{venue.name}</p>
            </div>
          </div>

          <Card className="p-8 max-w-5xl">
            <div className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venueName">Venue Name *</Label>
                    <Input 
                      id="venueName" 
                      value={formData.venueName}
                      onChange={(e) => setFormData({...formData, venueName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sport">Sport Type *</Label>
                    <Select value={formData.sport} onValueChange={(value) => setFormData({...formData, sport: value})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cricket">Cricket</SelectItem>
                        <SelectItem value="football">Football</SelectItem>
                        <SelectItem value="futsal">Futsal</SelectItem>
                        <SelectItem value="pickleball">Pickleball</SelectItem>
                        <SelectItem value="badminton">Badminton</SelectItem>
                        <SelectItem value="padel">Padel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea 
                    id="description" 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Pricing & Hours */}
              <div className="space-y-4 border-t pt-6">
                <h2 className="text-2xl font-bold">Pricing & Hours</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pricePerHour">Price per Hour (PKR) *</Label>
                    <Input 
                      id="pricePerHour" 
                      type="number"
                      min="0"
                      value={formData.pricePerHour}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value >= 0) setFormData({...formData, pricePerHour: e.target.value});
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfCourts">Number of Courts *</Label>
                    <Input
                      id="numberOfCourts"
                      type="number"
                      min="1"
                      step="1"
                      value={formData.numberOfCourts}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (e.target.value === "" || value >= 1) {
                          setFormData({ ...formData, numberOfCourts: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">WhatsApp Number *</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="is24_7"
                      checked={formData.is24_7}
                      onCheckedChange={(checked) => setFormData({...formData, is24_7: checked as boolean})}
                    />
                    <Label htmlFor="is24_7" className="cursor-pointer">Open 24/7</Label>
                  </div>
                  {!formData.is24_7 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="openingTime">Opening Time *</Label>
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

                {/* Dynamic Pricing */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Dynamic Pricing (Optional)</h3>
                      <p className="text-sm text-muted-foreground">Set different prices for specific days/times</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPricingRule}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>

                  {pricingRules.map((rule, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Rule {index + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removePricingRule(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div>
                        <Label className="text-xs mb-2">Select Days</Label>
                        <div className="grid grid-cols-7 gap-2 mt-2">
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
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            className="h-9"
                            value={rule.startTime}
                            onChange={(e) => updatePricingRule(index, 'startTime', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            className="h-9"
                            value={rule.endTime}
                            onChange={(e) => updatePricingRule(index, 'endTime', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price (PKR) *</Label>
                          <Input
                            type="number"
                            min="0"
                            className="h-9"
                            placeholder="e.g., 3000"
                            value={rule.price}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (value >= 0) updatePricingRule(index, 'price', e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loyalty Program */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Loyalty Program</h2>
                    <p className="text-sm text-muted-foreground mt-1">Reward returning players with automatic discounts based on their booking count</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setLoyaltyTiers([...loyaltyTiers, {
                      tier_name: loyaltyTiers.length === 0 ? 'Silver' : loyaltyTiers.length === 1 ? 'Gold' : 'Platinum',
                      min_bookings: '',
                      discount_percent: '',
                    }])}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Tier
                  </Button>
                </div>

                {loyaltyTiers.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-12 h-12 opacity-50" />
                      <p className="font-medium">No loyalty tiers configured</p>
                      <p className="text-sm">Click "Add Tier" to reward your regular players</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {loyaltyTiers.map((tier, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3 bg-amber-50/50 border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-semibold">Tier {index + 1}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setLoyaltyTiers(loyaltyTiers.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      <div>
                        <Label className="text-xs">Tier Name *</Label>
                        <Input
                          placeholder="e.g., Silver, Gold, Platinum"
                          className="h-9 mt-1"
                          value={tier.tier_name}
                          onChange={(e) => {
                            const updated = [...loyaltyTiers];
                            updated[index] = { ...updated[index], tier_name: e.target.value };
                            setLoyaltyTiers(updated);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Min Bookings *</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 5"
                            className="h-9 mt-1"
                            value={tier.min_bookings}
                            onChange={(e) => {
                              const updated = [...loyaltyTiers];
                              updated[index] = { ...updated[index], min_bookings: e.target.value.replace(/[^0-9]/g, '') };
                              setLoyaltyTiers(updated);
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Discount % *</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="e.g., 10"
                            className="h-9 mt-1"
                            value={tier.discount_percent}
                            onChange={(e) => {
                              const updated = [...loyaltyTiers];
                              const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                              if (parseFloat(cleaned) <= 100 || cleaned === '') {
                                updated[index] = { ...updated[index], discount_percent: cleaned };
                                setLoyaltyTiers(updated);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {tier.min_bookings && tier.discount_percent && (
                        <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-start gap-2">
                          <DollarSign className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-primary">
                            Players with {tier.min_bookings}+ bookings get {tier.discount_percent}% off
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4 border-t pt-6">
                <h2 className="text-2xl font-bold">Amenities & Features</h2>
                <div className="grid grid-cols-3 gap-3">
                  {commonAmenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`amenity-${amenity}`}
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <Label htmlFor={`amenity-${amenity}`} className="text-sm cursor-pointer">{amenity}</Label>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom amenity"
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomAmenity();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addCustomAmenity}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                      >
                        <span>{amenity}</span>
                        <button onClick={() => removeAmenity(amenity)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos */}
              <div className="space-y-4 border-t pt-6">
                <h2 className="text-2xl font-bold">Photos (min 1)</h2>
                
                {/* Existing Photos */}
                <div className="grid grid-cols-4 gap-4">
                  {existingPhotos.filter(p => !photosToDelete.includes(p.id)).map((photo) => (
                    <div key={photo.id} className="relative group aspect-square">
                      <img src={photo.photo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => removeExistingPhoto(photo.id)}
                        className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {/* New Photos */}
                  {newPhotoPreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative group aspect-square">
                      <img src={preview} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => removeNewPhoto(index)}
                        className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload Methods */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={uploadMethod === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadMethod('file')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMethod === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadMethod('url')}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Paste URL
                  </Button>
                </div>

                {uploadMethod === 'file' && (
                  <label className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer block">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">Click to upload photos</p>
                  </label>
                )}

                {uploadMethod === 'url' && (
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="Paste image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddImageUrl}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                )}
              </div>

              {/* Branding - Compact */}
              <div className="space-y-4 border-t pt-6">
                <h2 className="text-2xl font-bold">Branding & Social (Optional)</h2>
                
                {logoPreview && (
                  <div className="flex items-center gap-4">
                    <img src={logoPreview} alt="Logo" className="w-20 h-20 object-cover rounded" />
                    <Button variant="outline" size="sm" onClick={removeLogo}>
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="logo">Logo</Label>
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input id="tagline" value={formData.tagline} onChange={(e) => setFormData({...formData, tagline: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="facebookUrl">Facebook</Label>
                    <Input id="facebookUrl" type="url" value={formData.facebookUrl} onChange={(e) => setFormData({...formData, facebookUrl: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="instagramUrl">Instagram</Label>
                    <Input id="instagramUrl" type="url" value={formData.instagramUrl} onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                  <Input 
                    id="googleMapsUrl" 
                    type="url"
                    placeholder="Paste iframe code or URL"
                    value={formData.googleMapsUrl}
                    onChange={(e) => {
                      let value = e.target.value.trim();
                      const srcMatch = value.match(/src=["']([^"']+)["']/);
                      if (srcMatch) value = srcMatch[1];
                      setFormData({...formData, googleMapsUrl: value});
                    }}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-4 pt-6 border-t">
                <Button variant="outline" onClick={() => router.push('/owner/venues')} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

