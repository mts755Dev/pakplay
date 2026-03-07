"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Building2, DollarSign, Calendar, Eye, Upload, X, Clock, Phone, MapPin, Building, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LocationSelector } from "@/components/LocationSelector";
import { fetchVenueLoyaltyTiers, saveVenueLoyaltyTiers } from "@/lib/server-actions";
import { useAuth } from "@/contexts/AuthContext";

interface OwnerVenuesClientProps {
  initialVenues: any[];
}

export function OwnerVenuesClient({ initialVenues }: OwnerVenuesClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  // Use initial venues from server - no loading needed!
  const [venues, setVenues] = useState<any[]>(initialVenues);
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [deletingVenueId, setDeletingVenueId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit form states
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
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

  // Reviews management
  const [viewingReviewsVenue, setViewingReviewsVenue] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reportStatuses, setReportStatuses] = useState<Map<string, string>>(new Map());
  const [reportingReview, setReportingReview] = useState<any>(null);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

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

  const daysOfWeek = [
    { value: '1', label: 'Mon' },
    { value: '2', label: 'Tue' },
    { value: '3', label: 'Wed' },
    { value: '4', label: 'Thu' },
    { value: '5', label: 'Fri' },
    { value: '6', label: 'Sat' },
    { value: '0', label: 'Sun' },
  ];

  const { user: authUser, authReady } = useAuth();
  
  // Get user for update/delete operations from AuthContext (no network call)
  useEffect(() => {
    if (authReady && authUser) {
      setUser(authUser);
    }
  }, [authReady, authUser]);

  const fetchVenues = async (userId: string) => {
    // Refetch venues after update/delete
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*, venue_photos(*)')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      toast.error("Failed to load venues");
    }
  };

  const handleEditClick = async (venue: any) => {
    try {
      // Fetch complete venue data with pricing rules
      const { data: venueData, error } = await supabase
        .from('venues')
        .select('*, venue_photos(*), venue_pricing_rules(*)')
        .eq('id', venue.id)
        .single();

      if (error) throw error;

      setEditingVenue(venueData);
      setExistingPhotos(venueData.venue_photos || []);
      setNewPhotos([]);
      setNewPhotoPreviews([]);
      setPhotosToDelete([]);
      
      // Set logo preview if exists
      if (venueData.logo_url) {
        setLogoPreview(venueData.logo_url);
      } else {
        setLogoPreview("");
      }
      setLogo(null);

      // Populate form
      setFormData({
        venueName: venueData.name || "",
        sport: venueData.sport_type || "",
        province: venueData.province || "",
        city: venueData.city || "",
        area: venueData.area || "",
        subArea: venueData.sub_area || "",
        address: venueData.address || "",
        pricePerHour: venueData.price_per_hour?.toString() || "",
        phone: venueData.whatsapp_number || "",
        openingTime: venueData.opening_time || "",
        closingTime: venueData.closing_time || "",
        is24_7: venueData.is_24_7 || false,
        description: venueData.description || "",
        amenities: venueData.amenities || [],
        // Branding & customization
        tagline: venueData.tagline || "",
        facebookUrl: venueData.facebook_url || "",
        instagramUrl: venueData.instagram_url || "",
        googleMapsUrl: venueData.google_maps_url || "",
      });

      // Populate pricing rules
      if (venueData.venue_pricing_rules && venueData.venue_pricing_rules.length > 0) {
        const rules = venueData.venue_pricing_rules.reduce((acc: any[], rule: any) => {
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
      } else {
        setPricingRules([]);
      }

      // Load loyalty tiers
      const tiers = await fetchVenueLoyaltyTiers(venueData.id);
      if (tiers.length > 0) {
        setLoyaltyTiers(tiers.map(t => ({
          tier_name: t.tier_name,
          min_bookings: t.min_bookings.toString(),
          discount_percent: t.discount_percent.toString(),
        })));
      } else {
        setLoyaltyTiers([]);
      }

    } catch (error) {
      toast.error("Failed to load venue details");
    }
  };

  const handleViewReviews = async (venue: any) => {
    setViewingReviewsVenue(venue);
    setLoadingReviews(true);
    try {
      const { data: reviewsData } = await supabase
        .from('venue_reviews')
        .select('*')
        .eq('venue_id', venue.id)
        .order('date', { ascending: false });
      
      setReviews(reviewsData || []);

      // Fetch report statuses by this owner
      const { data: reportsData } = await supabase
        .from('review_reports')
        .select('review_id, status')
        .eq('venue_id', venue.id)
        .eq('reporter_id', user.id);
      
      const statusMap = new Map(reportsData?.map(r => [r.review_id, r.status]) || []);
      setReportStatuses(statusMap);
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReportReview = async () => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    if (!viewingReviewsVenue || !reportingReview) return;

    setSubmittingReport(true);
    try {
      const { error } = await supabase
        .from('review_reports')
        .insert({
          review_id: reportingReview.id,
          venue_id: viewingReviewsVenue.id,
          reporter_id: user.id,
          reason: reportReason,
        });

      if (error) throw error;

      // Add to report statuses
      setReportStatuses(prev => new Map(prev).set(reportingReview.id, 'pending'));

      toast.success("Review reported successfully. Admin will review it.");
      setReportingReview(null);
      setReportReason("");
    } catch (error) {
      toast.error("Failed to submit report");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (userId: string) => {
    if (!logo && !logoPreview) return null;
    if (!logo) return logoPreview; // Return existing logo URL if no new logo

    const fileExt = logo.name.split('.').pop();
    const fileName = `${userId}/${editingVenue.id}/logo.${fileExt}`;

    const { error } = await supabase.storage
      .from('venue-logos')
      .upload(fileName, logo, { upsert: true });

    if (error) {
      // Logo upload error - return existing logo URL
      return logoPreview;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venue-logos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalPhotos = existingPhotos.length - photosToDelete.length + newPhotos.length + files.length;
    
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

  const uploadNewPhotos = async (venueId: string, userId: string) => {
    const uploadedUrls: string[] = [];
    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i];
      const fileExt = photo.name.split('.').pop();
      const fileName = `${userId}/${venueId}/${Date.now()}_${i}.${fileExt}`;

      const { error } = await supabase.storage
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
    return uploadedUrls;
  };

  const handleSave = async () => {
    if (!editingVenue) return;

    if (!formData.venueName || !formData.sport || !formData.city || !formData.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    const remainingPhotos = existingPhotos.filter(p => !photosToDelete.includes(p.id)).length;
    if (remainingPhotos + newPhotos.length < 1) {
      toast.error("Please keep at least 1 photo");
      return;
    }

    setSaving(true);
    setUploading(newPhotos.length > 0);

    try {
      // Upload logo if changed
      const logoUrl = await uploadLogo(user!.id);

      // Update venue
      const { error: venueError } = await supabase
        .from('venues')
        .update({
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
          opening_time: formData.is24_7 ? null : formData.openingTime,
          closing_time: formData.is24_7 ? null : formData.closingTime,
          is_24_7: formData.is24_7,
          whatsapp_number: formData.phone,
          // Customization fields
          logo_url: logoUrl,
          tagline: formData.tagline || null,
          facebook_url: formData.facebookUrl || null,
          instagram_url: formData.instagramUrl || null,
          google_maps_url: formData.googleMapsUrl || null,
        })
        .eq('id', editingVenue.id);

      if (venueError) throw venueError;

      // Delete marked photos
      if (photosToDelete.length > 0) {
        await supabase.from('venue_photos').delete().in('id', photosToDelete);
      }

      // Upload new photos
      if (newPhotos.length > 0) {
        const photoUrls = await uploadNewPhotos(editingVenue.id, user!.id);
        if (photoUrls.length > 0) {
          const photoInserts = photoUrls.map((url, index) => ({
            venue_id: editingVenue.id,
            photo_url: url,
            is_primary: remainingPhotos === 0 && index === 0,
            display_order: remainingPhotos + index,
          }));
          await supabase.from('venue_photos').insert(photoInserts);
        }
      }

      // Update pricing rules
      await supabase.from('venue_pricing_rules').delete().eq('venue_id', editingVenue.id);
      if (pricingRules.length > 0) {
        const pricingInserts: any[] = [];
        pricingRules.forEach((rule, index) => {
          if (rule.daysOfWeek.length === 0) {
            pricingInserts.push({
              venue_id: editingVenue.id,
              day_of_week: null,
              start_time: rule.startTime || null,
              end_time: rule.endTime || null,
              price_per_hour: parseFloat(rule.price),
              priority: index,
            });
          } else {
            rule.daysOfWeek.forEach(day => {
              pricingInserts.push({
                venue_id: editingVenue.id,
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
          await supabase.from('venue_pricing_rules').insert(pricingInserts);
        }
      }

      // Save loyalty tiers
      const validTiers = loyaltyTiers.filter(
        t => t.tier_name.trim() && parseInt(t.min_bookings) > 0 && parseFloat(t.discount_percent) > 0
      );
      const { error: loyaltyError } = await saveVenueLoyaltyTiers(
        editingVenue.id,
        validTiers.map(t => ({
          tier_name: t.tier_name.trim(),
          min_bookings: parseInt(t.min_bookings),
          discount_percent: parseFloat(t.discount_percent),
        }))
      );
      if (loyaltyError) {
        console.error('Error saving loyalty tiers:', loyaltyError);
      }

      toast.success("Venue updated successfully!");
      setEditingVenue(null);
      fetchVenues(user!.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to update venue");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVenueId) return;

    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', deletingVenueId);

      if (error) throw error;

      toast.success("Venue deleted successfully");
      setDeletingVenueId(null);
      fetchVenues(user!.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete venue");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-500',
      approved: 'bg-green-500/10 text-green-500',
      rejected: 'bg-red-500/10 text-red-500',
      inactive: 'bg-gray-500/10 text-gray-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="owner" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Venues</h1>
              <p className="text-muted-foreground mt-1">Manage all your venues</p>
            </div>
            <Link href="/owner/list-venue">
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add New Venue
              </Button>
            </Link>
          </div>

          <Card className="p-6">
            {venues.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No venues yet</h3>
                <p className="text-muted-foreground mb-6">Start by adding your first venue</p>
                <Link href="/owner/list-venue">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Venue
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {venues.map((venue) => (
                  <div key={venue.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {venue.venue_photos?.[0]?.photo_url ? (
                          <img 
                            src={venue.venue_photos[0].photo_url} 
                            alt={venue.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{venue.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {venue.city} • {venue.sport_type}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(venue.status)}`}>
                            {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">PKR {venue.price_per_hour}/hr</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{venue.total_bookings || 0} bookings</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          {venue.status === 'approved' && (
                            <Link href={`/venue/${venue.slug}`} target="_blank">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Page
                              </Button>
                            </Link>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(venue)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewReviews(venue)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Reviews
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setDeletingVenueId(venue.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingVenue} onOpenChange={(open) => {
        if (!open) {
          setEditingVenue(null);
          setLoyaltyTiers([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
            <DialogDescription>Update your venue details</DialogDescription>
          </DialogHeader>

          {editingVenue && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
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
                  <Label htmlFor="address">Address *</Label>
                  <Textarea 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
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

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea 
                    id="description" 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">Amenities</h3>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {commonAmenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`amenity-${amenity}`}
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={() => {
                          if (formData.amenities.includes(amenity)) {
                            setFormData({...formData, amenities: formData.amenities.filter(a => a !== amenity)});
                          } else {
                            setFormData({...formData, amenities: [...formData.amenities, amenity]});
                          }
                        }}
                      />
                      <Label htmlFor={`amenity-${amenity}`} className="text-xs cursor-pointer">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Fields - Compact */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">Optional Details</h3>
                
                {logoPreview && (
                  <div className="w-20 h-20 border rounded overflow-hidden">
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <Label htmlFor="logo" className="text-xs">Logo</Label>
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="text-xs h-8" />
                </div>

                <div>
                  <Label htmlFor="tagline" className="text-xs">Tagline</Label>
                  <Input id="tagline" placeholder="e.g., Where Champions Are Made" value={formData.tagline} onChange={(e) => setFormData({...formData, tagline: e.target.value})} className="text-xs h-8" />
                </div>

                <div>
                  <Label htmlFor="googleMapsUrl" className="text-xs">Google Maps URL</Label>
                  <Input 
                    id="googleMapsUrl" 
                    type="url" 
                    placeholder="Paste full iframe code or just URL..." 
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
                    className="text-xs h-8" 
                  />
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✅ Paste full iframe code - we'll extract the URL automatically!</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="facebookUrl" className="text-xs">Facebook</Label>
                    <Input id="facebookUrl" type="url" value={formData.facebookUrl} onChange={(e) => setFormData({...formData, facebookUrl: e.target.value})} className="text-xs h-8" />
                  </div>
                  <div>
                    <Label htmlFor="instagramUrl" className="text-xs">Instagram</Label>
                    <Input id="instagramUrl" type="url" value={formData.instagramUrl} onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})} className="text-xs h-8" />
                  </div>
                </div>

              </div>

              {/* Pricing Rules - Compact */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Dynamic Pricing</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPricingRules([...pricingRules, {
                      daysOfWeek: [],
                      startTime: "",
                      endTime: "",
                      price: formData.pricePerHour
                    }])}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Rule
                  </Button>
                </div>

                {pricingRules.map((rule, index) => (
                  <div key={index} className="border rounded p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Rule {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPricingRules(pricingRules.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day.value}
                          onClick={() => {
                            const newDays = rule.daysOfWeek.includes(day.value)
                              ? rule.daysOfWeek.filter(d => d !== day.value)
                              : [...rule.daysOfWeek, day.value];
                            const updated = [...pricingRules];
                            updated[index] = { ...updated[index], daysOfWeek: newDays };
                            setPricingRules(updated);
                          }}
                          className={`
                            py-1 px-1 text-center rounded cursor-pointer border text-xs
                            ${rule.daysOfWeek.includes(day.value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:border-primary/50'
                            }
                          `}
                        >
                          {day.label}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="time"
                        placeholder="Start"
                        className="text-xs h-8"
                        value={rule.startTime}
                        onChange={(e) => {
                          const updated = [...pricingRules];
                          updated[index] = { ...updated[index], startTime: e.target.value };
                          setPricingRules(updated);
                        }}
                      />
                      <Input
                        type="time"
                        placeholder="End"
                        className="text-xs h-8"
                        value={rule.endTime}
                        onChange={(e) => {
                          const updated = [...pricingRules];
                          updated[index] = { ...updated[index], endTime: e.target.value };
                          setPricingRules(updated);
                        }}
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Price"
                        className="text-xs h-8"
                        value={rule.price}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value >= 0) {
                            const updated = [...pricingRules];
                            updated[index] = { ...updated[index], price: e.target.value };
                            setPricingRules(updated);
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Loyalty Program */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Loyalty Program</h3>
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
                    <Plus className="w-3 h-3 mr-1" />
                    Add Tier
                  </Button>
                </div>

                {loyaltyTiers.length === 0 && (
                  <div className="border-2 border-dashed rounded p-4 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-8 h-8 opacity-50" />
                      <p className="text-xs font-medium">No loyalty tiers configured</p>
                      <p className="text-xs">Click "Add Tier" to reward your regular players</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {loyaltyTiers.map((tier, index) => (
                    <div key={index} className="border rounded p-3 space-y-2 bg-amber-50/50 border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 text-amber-600" />
                          <span className="text-xs font-semibold">Tier {index + 1}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLoyaltyTiers(loyaltyTiers.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>

                      <div>
                        <Label className="text-xs">Tier Name *</Label>
                        <Input
                          placeholder="e.g., Silver, Gold, Platinum"
                          className="text-xs h-8 mt-1"
                          value={tier.tier_name}
                          onChange={(e) => {
                            const updated = [...loyaltyTiers];
                            updated[index] = { ...updated[index], tier_name: e.target.value };
                            setLoyaltyTiers(updated);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Min Bookings *</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 5"
                            className="text-xs h-8 mt-1"
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
                            className="text-xs h-8 mt-1"
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
                        <div className="bg-primary/10 border border-primary/20 rounded p-2 flex items-start gap-2">
                          <DollarSign className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-primary">
                            Players with {tier.min_bookings}+ bookings get {tier.discount_percent}% off
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos - Compact */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">Photos (min 3)</h3>
                
                <div className="grid grid-cols-5 gap-2">
                  {existingPhotos.filter(p => !photosToDelete.includes(p.id)).map((photo) => (
                    <div key={photo.id} className="relative group aspect-square">
                      <img src={photo.photo_url} alt="" className="w-full h-full object-cover rounded" />
                      <button
                        onClick={() => setPhotosToDelete([...photosToDelete, photo.id])}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {newPhotoPreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative group aspect-square">
                      <img src={preview} alt="" className="w-full h-full object-cover rounded" />
                      <button
                        onClick={() => {
                          setNewPhotos(newPhotos.filter((_, i) => i !== index));
                          setNewPhotoPreviews(newPhotoPreviews.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {existingPhotos.length - photosToDelete.length + newPhotos.length < 10 && (
                    <label className="aspect-square border-2 border-dashed rounded cursor-pointer hover:border-primary flex items-center justify-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVenue(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingVenueId} onOpenChange={(open) => !open && setDeletingVenueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your venue and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Reviews Modal */}
      <Dialog open={!!viewingReviewsVenue} onOpenChange={(open) => !open && setViewingReviewsVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Reviews - {viewingReviewsVenue?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingReviews ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.customer_name}</span>
                          <span className="text-yellow-500">
                            {'⭐'.repeat(review.rating)}
                          </span>
                          {review.is_featured && (
                            <Badge className="text-xs">Featured</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{review.review_text}</p>
                        
                        {review.photo_urls && review.photo_urls.length > 0 && (
                          <div className="grid grid-cols-5 gap-2 mb-2">
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
                        
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </p>
                      </div>
                      {reportStatuses.has(review.id) ? (
                        reportStatuses.get(review.id) === 'pending' ? (
                          <Badge variant="default" className="bg-yellow-500 cursor-default">
                            Reported (Pending)
                          </Badge>
                        ) : reportStatuses.get(review.id) === 'rejected' ? (
                          <Badge variant="destructive" className="cursor-default">
                            Rejected by Admin
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500 cursor-default">
                            Approved by Admin
                          </Badge>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReportingReview(review);
                            setReportReason("");
                          }}
                        >
                          Report
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No reviews yet for this venue.</p>
                <p className="text-sm text-muted-foreground mt-2">Reviews from customers will appear here.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setViewingReviewsVenue(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Review Dialog */}
      <Dialog open={!!reportingReview} onOpenChange={(open) => !open && setReportingReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reportingReview && (
              <div className="bg-accent/10 p-4 rounded-lg">
                <p className="text-sm mb-2"><strong>Customer:</strong> {reportingReview.customer_name}</p>
                <p className="text-sm mb-2"><strong>Review:</strong> {reportingReview.review_text}</p>
                {reportingReview.photo_urls && reportingReview.photo_urls.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {reportingReview.photo_urls.map((photo: string, photoIndex: number) => (
                      <img
                        key={photoIndex}
                        src={photo}
                        alt={`Review photo ${photoIndex + 1}`}
                        className="w-full aspect-square object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="reportReason">Reason for reporting *</Label>
              <Textarea
                id="reportReason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please explain why this review is inappropriate (e.g., spam, abusive language, false information)..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setReportingReview(null)}
              variant="outline"
              disabled={submittingReport}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportReview}
              disabled={submittingReport || !reportReason.trim()}
            >
              {submittingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

