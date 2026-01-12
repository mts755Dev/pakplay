"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Tag, Percent, Edit, Trash2, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Tables } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Venue = Tables<'venues'>;
type SpecialOffer = Tables<'special_offers'>;

export function OwnerSpecialOffersClient() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);

  // Form state
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [offerName, setOfferName] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  // Auto-fill original price when venue is selected
  useEffect(() => {
    if (selectedVenueId && !editingOffer) {
      const selectedVenue = venues.find(v => v.id === selectedVenueId);
      if (selectedVenue) {
        setOriginalPrice(selectedVenue.price_per_hour.toString());
      }
    }
  }, [selectedVenueId, venues, editingOffer]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          toast.error("Access denied. Please use admin dashboard.");
          window.location.href = "/admin/dashboard";
          return;
        }

        if (profile?.role !== 'venue_owner') {
          toast.error("Access denied. Venue owners only.");
          window.location.href = "/";
          return;
        }
        setUser(user);
        fetchVenues(user.id);
        fetchOffers(user.id);
      } else {
        window.location.href = "/signin";
      }
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchVenues = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_id', userId)
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      setVenues(data || []);
    } catch (error: any) {
      toast.error('Failed to load venues');
    }
  };

  const fetchOffers = async (userId: string) => {
    try {
      const { data: venuesData } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', userId);

      if (!venuesData || venuesData.length === 0) {
        setLoading(false);
        return;
      }

      const venueIds = venuesData.map(v => v.id);

      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedVenueId('');
    setOfferName('');
    setDescription('');
    setOriginalPrice('');
    setOfferPrice('');
    setValidFrom('');
    setValidUntil('');
    setIsActive(true);
    setEditingOffer(null);
  };

  const handleOpenDialog = (offer?: SpecialOffer) => {
    if (offer) {
      setEditingOffer(offer);
      setSelectedVenueId(offer.venue_id);
      setOfferName(offer.offer_name);
      setDescription(offer.description || '');
      setOriginalPrice(offer.original_price.toString());
      setOfferPrice(offer.offer_price.toString());
      setValidFrom(offer.valid_from.split('T')[0] + 'T' + offer.valid_from.split('T')[1].substring(0, 5));
      setValidUntil(offer.valid_until.split('T')[0] + 'T' + offer.valid_until.split('T')[1].substring(0, 5));
      setIsActive(offer.is_active);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedVenueId || !offerName || !originalPrice || !offerPrice || !validFrom || !validUntil) {
      toast.error('Please fill in all required fields');
      return;
    }

    const origPrice = parseFloat(originalPrice);
    const offPrice = parseFloat(offerPrice);

    if (offPrice >= origPrice) {
      toast.error('Offer price must be less than original price');
      return;
    }

    if (new Date(validUntil) <= new Date(validFrom)) {
      toast.error('End date must be after start date');
      return;
    }

    // Check if venue already has an active offer (only when creating new)
    if (!editingOffer) {
      const existingOffer = offers.find(o => o.venue_id === selectedVenueId);
      if (existingOffer) {
        toast.error('This venue already has an offer. Please edit or delete the existing one first.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const offerData = {
        venue_id: selectedVenueId,
        offer_name: offerName,
        description: description || null,
        original_price: origPrice,
        offer_price: offPrice,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
        is_active: isActive,
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('special_offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;
        toast.success('Offer updated successfully!');
      } else {
        const { error } = await supabase
          .from('special_offers')
          .insert([offerData]);

        if (error) throw error;
        toast.success('Offer created successfully!');
      }

      setDialogOpen(false);
      resetForm();
      if (user) fetchOffers(user.id);
    } catch (error: any) {
      toast.error('Failed to save offer');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (offerId: string) => {
    setOfferToDelete(offerId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!offerToDelete) return;

    try {
      const { error } = await supabase
        .from('special_offers')
        .delete()
        .eq('id', offerToDelete);

      if (error) throw error;
      toast.success('Offer deleted successfully!');
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
      if (user) fetchOffers(user.id);
    } catch (error: any) {
      toast.error('Failed to delete offer');
    }
  };

  const toggleOfferStatus = async (offer: SpecialOffer) => {
    try {
      const { error } = await supabase
        .from('special_offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offer.id);

      if (error) throw error;
      toast.success(`Offer ${!offer.is_active ? 'activated' : 'deactivated'} successfully!`);
      if (user) fetchOffers(user.id);
    } catch (error: any) {
      toast.error('Failed to update offer status');
    }
  };

  const getVenueName = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    return venue?.name || 'Unknown Venue';
  };

  const isOfferActive = (offer: SpecialOffer) => {
    const now = new Date();
    const from = new Date(offer.valid_from);
    const until = new Date(offer.valid_until);
    return offer.is_active && now >= from && now <= until;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="venue_owner" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Special Offers</h1>
                <p className="text-muted-foreground">
                  Create and manage promotional pricing for your venues
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Offer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOffer ? 'Edit Special Offer' : 'Create New Special Offer'}
                    </DialogTitle>
                    <DialogDescription>
                      Set up promotional pricing for your venue (one offer per venue)
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="venue">Venue *</Label>
                      <Select 
                        value={selectedVenueId} 
                        onValueChange={setSelectedVenueId}
                        disabled={!!editingOffer}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {venues.map(venue => {
                            const hasOffer = offers.some(o => o.venue_id === venue.id && (!editingOffer || o.id !== editingOffer.id));
                            return (
                              <SelectItem 
                                key={venue.id} 
                                value={venue.id}
                                disabled={hasOffer}
                              >
                                {venue.name} {hasOffer ? '(Already has offer)' : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {editingOffer && (
                        <p className="text-xs text-muted-foreground">Venue cannot be changed when editing</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="offerName">Offer Name *</Label>
                      <Input
                        id="offerName"
                        placeholder="e.g., Weekend Special"
                        value={offerName}
                        onChange={(e) => setOfferName(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Optional description of the offer"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="originalPrice">Original Price (PKR) *</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          placeholder="1500"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">Auto-filled from venue</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="offerPrice">Offer Price (PKR) *</Label>
                        <Input
                          id="offerPrice"
                          type="number"
                          min="0"
                          max={originalPrice ? parseFloat(originalPrice) - 1 : undefined}
                          placeholder="1200"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Must be less than original price</p>
                      </div>
                    </div>

                    {originalPrice && offerPrice && parseFloat(offerPrice) < parseFloat(originalPrice) && (
                      <div className="text-sm text-muted-foreground bg-primary/10 p-3 rounded-md">
                        <Percent className="w-4 h-4 inline mr-2" />
                        Discount: {((1 - parseFloat(offerPrice) / parseFloat(originalPrice)) * 100).toFixed(0)}% off
                      </div>
                    )}

                     <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-2">
                         <Label htmlFor="validFrom">Valid From *</Label>
                         <Input
                           id="validFrom"
                           type="datetime-local"
                           min={new Date().toISOString().slice(0, 16)}
                           value={validFrom}
                           onChange={(e) => setValidFrom(e.target.value)}
                         />
                       </div>
                       <div className="grid gap-2">
                         <Label htmlFor="validUntil">Valid Until *</Label>
                         <Input
                           id="validUntil"
                           type="datetime-local"
                           min={validFrom || new Date().toISOString().slice(0, 16)}
                           value={validUntil}
                           onChange={(e) => setValidUntil(e.target.value)}
                         />
                       </div>
                     </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        Activate offer immediately
                      </Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingOffer ? 'Update Offer' : 'Create Offer'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Offers List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : offers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No special offers yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first promotional offer to attract more customers
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Offer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {offers.map((offer) => (
                <Card key={offer.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{offer.offer_name}</CardTitle>
                          {isOfferActive(offer) ? (
                            <Badge className="bg-green-500">Active Now</Badge>
                          ) : offer.is_active ? (
                            <Badge variant="secondary">Scheduled</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {getVenueName(offer.venue_id)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(offer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleOfferStatus(offer)}
                        >
                          {offer.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                         <Button
                           size="sm"
                           variant="destructive"
                           onClick={() => confirmDelete(offer.id)}
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Pricing</p>
                        <div className="flex items-center gap-3">
                          <span className="text-lg line-through text-muted-foreground">
                            PKR {offer.original_price.toLocaleString()}
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            PKR {offer.offer_price.toLocaleString()}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {offer.discount_percentage?.toFixed(0)}% OFF
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Valid From
                        </p>
                        <p className="font-medium">{formatDateTime(offer.valid_from)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Valid Until
                        </p>
                        <p className="font-medium">{formatDateTime(offer.valid_until)}</p>
                      </div>
                    </div>
                    
                    {offer.description && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Special Offer</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this special offer? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Offer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

