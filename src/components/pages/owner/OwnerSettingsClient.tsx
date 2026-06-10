"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, AlertTriangle, Globe, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OwnerSettingsClientProps {
  initialVenues: Array<{ id: string; name: string; slug: string; subdomain: string | null }>;
  userId: string;
}

export function OwnerSettingsClient({ initialVenues, userId }: OwnerSettingsClientProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [venues, setVenues] = useState(initialVenues);
  const [selectedVenue, setSelectedVenue] = useState<string>(initialVenues[0]?.id || '');
  const [customSubdomain, setCustomSubdomain] = useState(initialVenues[0]?.subdomain || '');
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleVenueChange = (venueId: string) => {
    setSelectedVenue(venueId);
    const venue = venues.find(v => v.id === venueId);
    if (venue) {
      setCustomSubdomain(venue.subdomain || '');
    }
  };

  const handleSaveSubdomain = async () => {
    if (!selectedVenue) {
      toast.error("Please select a venue");
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (customSubdomain && !subdomainRegex.test(customSubdomain)) {
      toast.error("Subdomain can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    if (customSubdomain && customSubdomain.length < 3) {
      toast.error("Subdomain must be at least 3 characters long");
      return;
    }

    // Check if subdomain is already taken
    if (customSubdomain) {
      const { data: existingVenue } = await supabase
        .from('venues')
        .select('id')
        .eq('subdomain', customSubdomain)
        .neq('id', selectedVenue)
        .single();

      if (existingVenue) {
        toast.error("This subdomain is already taken");
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('venues')
        .update({ subdomain: customSubdomain || null })
        .eq('id', selectedVenue);

      if (error) throw error;

      toast.success("Custom subdomain updated successfully!");

      setVenues((prev) =>
        prev.map((v) =>
          v.id === selectedVenue ? { ...v, subdomain: customSubdomain || null } : v
        )
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update subdomain");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    const venue = venues.find(v => v.id === selectedVenue);
    if (venue && venue.subdomain) {
      const url = `https://${venue.subdomain}.pakplay.co`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setFormData({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      // Call the database function to delete the user account
      // This will cascade delete all related data:
      // - Profile
      // - All venues owned by this user
      // - All venue photos for those venues
      // - All bookings for those venues
      // - All special offers for those venues
      // - All pricing rules for those venues
      // - All reviews for those venues
      // - All review reports for those reviews
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        toast.error(error.message || "Failed to delete account. Please try again.");
        return;
      }

      toast.success("Account deleted successfully");
      
      // Redirect to home (user is already deleted, so no need to sign out)
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
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
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings and security</p>
          </div>

          <div className="max-w-3xl space-y-6">
              {/* Custom Subdomain */}
              {venues.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Custom Subdomain</h2>
                      <p className="text-sm text-muted-foreground">Use your venue page as a website with a custom subdomain</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="venue">Select Venue</Label>
                      <Select value={selectedVenue} onValueChange={handleVenueChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {venues.map((venue) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              {venue.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subdomain">Custom Subdomain</Label>
                      <div className="flex gap-2">
                        <Input
                          id="subdomain"
                          value={customSubdomain}
                          onChange={(e) => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="myvenuehere"
                          className="flex-1"
                        />
                        <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">.pakplay.co</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use lowercase letters, numbers, and hyphens only (min. 3 characters)
                      </p>
                    </div>

                    {customSubdomain && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">Your custom URL:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">
                            https://{customSubdomain}.pakplay.co
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={copyToClipboard}
                            className="shrink-0"
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          {venues.find(v => v.id === selectedVenue)?.subdomain && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://${customSubdomain}.pakplay.co`, '_blank')}
                              className="shrink-0"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSaveSubdomain}
                      disabled={saving || !selectedVenue}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 mr-2" />
                          Save Custom Subdomain
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Change Password */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Change Password</h2>
                    <p className="text-sm text-muted-foreground">Update your password for security</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={saving || !formData.newPassword || !formData.confirmPassword}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Danger Zone */}
              <Card className="p-6 border-red-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                    <p className="text-sm text-muted-foreground">Irreversible actions</p>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers, including all your venues and bookings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        disabled={saving}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Account'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            </div>
        </div>
      </div>
    </div>
  );
}

