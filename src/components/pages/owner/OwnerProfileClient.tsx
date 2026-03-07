"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Loader2, Save, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function OwnerProfileClient() {
  const { user: authUser, userRole, isLoggedIn, authReady } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [venueStats, setVenueStats] = useState({ total: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    whatsapp_number: '',
    email: '',
  });

  useEffect(() => {
    if (!authReady) return;

    if (!isLoggedIn || !authUser) {
      window.location.href = '/signin';
      setAuthChecking(false);
      setLoading(false);
      return;
    }

    if (userRole === 'admin') {
      toast.error("Access denied. Please use admin dashboard.");
      window.location.href = '/admin/dashboard';
      return;
    }

    if (userRole !== 'venue_owner') {
      toast.error("Access denied. Venue owners only.");
      window.location.href = '/';
      return;
    }

    setUser(authUser);
    setAuthChecking(false);
    loadProfileData(authUser.id, authUser.email);
  }, [authReady, isLoggedIn, authUser, userRole]);

  const loadProfileData = async (userId: string, email: string) => {
    try {
      // Use supabase client directly - data queries read session from cookies
      // (unlike .auth.getUser()/.auth.getSession() which can hang)
      const [profileResult, venuesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('venues').select('id, status').eq('owner_id', userId),
      ]);

      if (profileResult.error) throw profileResult.error;

      setProfile(profileResult.data);
      setFormData({
        full_name: profileResult.data?.full_name || '',
        phone: profileResult.data?.phone || '',
        whatsapp_number: profileResult.data?.whatsapp_number || '',
        email: email || '',
      });
      setVenueStats({
        total: venuesResult.data?.length || 0,
        approved: venuesResult.data?.filter((v: any) => v.status === 'approved').length || 0,
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Check if email has changed
      const emailChanged = formData.email !== user.email;
      
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          whatsapp_number: formData.whatsapp_number,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // If email changed, update it using edge function
      if (emailChanged) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error("Please enter a valid email address");
          setSaving(false);
          return;
        }

        // Call edge function to update email immediately
        const { data: emailData, error: emailError } = await supabase.functions.invoke('update-email', {
          body: { email: formData.email }
        });

        if (emailError) throw emailError;

        if (!emailData?.success) {
          throw new Error(emailData?.error || "Failed to update email");
        }

        toast.success("Email updated successfully! Please sign in again with your new email.");
        
        // Sign out and redirect to signin
        await supabase.auth.signOut();
        window.location.href = '/signin';
        return;
      }

      toast.success("Profile updated successfully!");
      if (authUser) loadProfileData(authUser.id, authUser.email || '');
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="owner" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

