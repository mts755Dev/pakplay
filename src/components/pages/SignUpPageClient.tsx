"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, User, Building2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";
import ppLogo from "@/assets/pp logo.png";

export function SignUpPageClient() {
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [role, setRole] = useState<"player" | "venue_owner">("player");
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = { fullName: "", phone: "", email: "", password: "" };

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      valid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
      valid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

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

      // Sign up with role in metadata
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: role,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Upsert profile with role, phone, and WhatsApp number
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: formData.fullName,
            phone: formData.phone,
            whatsapp_number: formData.phone,
            role: role,
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Profile upsert error:', profileError);
        }

        // Cache role in localStorage
        localStorage.setItem('user_role', role);

        const roleMessage = role === 'venue_owner' 
          ? 'You can now list your venues!' 
          : 'Start booking your favorite sports venues!';
        toast.success(`Account created successfully! ${roleMessage}`);
        
        // Route based on role
        if (role === 'venue_owner') {
          window.location.href = '/owner/dashboard';
        } else {
          window.location.href = '/';
        }
        return;
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src={ppLogo.src} alt="PakPlay" className="h-20 w-auto mx-auto" />
          </Link>
          <p className="text-muted-foreground">
            {role === 'player' 
              ? 'Start booking your favorite sports venues' 
              : 'Join PakPlay to manage your sports venues'}
          </p>
        </div>

        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Create Account</h1>

          {/* Role Selection */}
          <div className="mb-6">
            <Label className="mb-3 block">I am a:</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('player')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  role === 'player'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-background hover:border-muted-foreground/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  role === 'player' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                }`}>
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className={`font-semibold text-sm ${role === 'player' ? 'text-primary' : 'text-foreground'}`}>
                    Player
                  </div>
                  <div className="text-xs text-muted-foreground">Book venues</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('venue_owner')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  role === 'venue_owner'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-background hover:border-muted-foreground/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  role === 'venue_owner' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className={`font-semibold text-sm ${role === 'venue_owner' ? 'text-primary' : 'text-foreground'}`}>
                    Venue Owner
                  </div>
                  <div className="text-xs text-muted-foreground">List venues</div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                }}
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+92 300 0000000"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                }}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
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
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
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
              size="lg"
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
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/signin" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </Card>

        {/* What's Next Card */}
        <Card className="mt-6 p-6 bg-accent/5 border-accent/20">
          <h3 className="font-bold mb-2 text-foreground">What's Next?</h3>
          {role === 'venue_owner' ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Access your owner dashboard</li>
              <li>✓ List your first venue</li>
              <li>✓ Get your unique venue page</li>
              <li>✓ Start receiving bookings</li>
            </ul>
          ) : (
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Browse verified sports venues</li>
              <li>✓ Book your favorite courts</li>
              <li>✓ Get instant confirmation</li>
              <li>✓ Earn loyalty discounts</li>
            </ul>
          )}
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
