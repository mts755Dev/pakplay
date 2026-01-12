"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";
import ppLogo from "@/assets/pp logo.png";

export function SignUpPageClient() {
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });

  const handleSignup = async () => {
    if (!formData.fullName || !formData.phone || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the captcha verification");
      return;
    }

    setLoading(true);
    try {
      // Verify captcha with backend
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-turnstile', {
        body: { token: captchaToken }
      });

      if (verifyError || !verifyData?.success) {
        toast.error("Captcha verification failed. Please try again.");
        setCaptchaToken("");
        setTurnstileKey(prev => prev + 1);
        setLoading(false);
        return;
      }

      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update profile with phone and WhatsApp number
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            phone: formData.phone,
            whatsapp_number: formData.phone,
            role: 'venue_owner'
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
        }

        toast.success("Account created successfully! Welcome to PakPlay.");
        
        // Redirect to dashboard
        router.push('/owner/dashboard');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || "Failed to create account");
      setCaptchaToken("");
      setTurnstileKey(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src={ppLogo.src} alt="PakPlay" className="h-12 w-auto" />
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">
              Create Account
            </h1>
            <p className="text-muted-foreground mb-6">
              Join PakPlay to manage your sports venues
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+92 300 0000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be used for WhatsApp booking notifications
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <Label>Verify you're human *</Label>
                <div className="mt-2">
                  <Turnstile
                    key={turnstileKey}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onError={() => {
                      setCaptchaToken("");
                      setTurnstileKey(prev => prev + 1);
                      toast.error("Captcha verification failed. Please try again.");
                    }}
                    onExpire={() => {
                      setCaptchaToken("");
                      setTurnstileKey(prev => prev + 1);
                    }}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSignup} 
                className="w-full" 
                disabled={loading || !captchaToken}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => router.push('/signin')}
                  className="text-sm text-primary hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          </Card>

          <Card className="mt-6 p-6 bg-accent/5 border-accent/20">
            <h3 className="font-bold mb-2 text-foreground">What's Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Access your owner dashboard</li>
              <li>✓ List your first venue</li>
              <li>✓ Get your unique venue page</li>
              <li>✓ Start receiving bookings</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

