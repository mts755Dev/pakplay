"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { updateUserProfile } from "@/lib/server-actions";
import { supabase } from "@/integrations/supabase/client";
import { User, Loader2, Save, Building2, Calendar } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { signOutClient } from "@/lib/sign-out";

interface OwnerProfileClientProps {
  initialProfile: Tables<'profiles'> | null;
  initialVenueStats: { total: number; approved: number };
  userEmail: string;
  userId: string;
}

export function OwnerProfileClient({
  initialProfile,
  initialVenueStats,
  userEmail,
  userId,
}: OwnerProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [venueStats] = useState(initialVenueStats);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialProfile?.full_name || '',
    phone: initialProfile?.phone || '',
    whatsapp_number: initialProfile?.whatsapp_number || '',
    email: userEmail,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const emailChanged = formData.email !== userEmail;

      const result = await updateUserProfile({
        fullName: formData.full_name,
        phone: formData.phone,
        whatsappNumber: formData.whatsapp_number,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      if (emailChanged) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error("Please enter a valid email address");
          setSaving(false);
          return;
        }

        const { data: emailData, error: emailError } = await supabase.functions.invoke('update-email', {
          body: { email: formData.email }
        });

        if (emailError) throw emailError;

        if (!emailData?.success) {
          throw new Error(emailData?.error || "Failed to update email");
        }

        toast.success("Email updated successfully! Please sign in again with your new email.");
        signOutClient('/signin');
        return;
      }

      setProfile((prev) => prev ? {
        ...prev,
        full_name: formData.full_name,
        phone: formData.phone,
        whatsapp_number: formData.whatsapp_number,
      } : prev);

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="owner" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information</p>
          </div>

          <div className="max-w-3xl space-y-6">
            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Venues</p>
                    <h3 className="text-3xl font-bold mt-2">{venueStats.total}</h3>
                  </div>
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <h3 className="text-lg font-bold mt-2">
                      {profile ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      }) : 'N/A'}
                    </h3>
                  </div>
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </Card>
            </div>

            {/* Profile Information */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">Update your profile details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92 300 0000000"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp Number (Optional)</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleInputChange}
                    placeholder="+92 300 0000000"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
