"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import ppLogo from "@/assets/pp logo.png";

export function SignInPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const router = useRouter();

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        // Block admins from signing in here
        if (profile?.role === 'admin') {
          await supabase.auth.signOut();
          toast.error("Admins must sign in at /admin");
          setLoading(false);
          return;
        }

        // Cache role in localStorage
        if (profile?.role) {
          localStorage.setItem('user_role', profile.role);
        }

        toast.success("Welcome back!");
        
        // Route based on role — owners go to dashboard, players go to home
        setTimeout(() => {
          if (profile?.role === 'venue_owner') {
            window.location.href = '/owner/dashboard';
          } else {
            window.location.href = '/';
          }
        }, 100);
        
        // Keep loading state to prevent UI flicker
        return;
      }
    } catch (error: any) {
      setLoading(false);
      if (error.message?.includes('fetch') || error.message?.includes('network') || !error.message) {
        toast.error("Invalid email or password. Please check your credentials and try again.");
      } else if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
        toast.error("Invalid email or password. Please check your credentials and try again.");
      } else {
        toast.error(error.message || "Invalid email or password. Please check your credentials and try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src={ppLogo.src} alt="PakPlay" className="h-20 w-auto mx-auto" />
          </Link>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                disabled={loading}
                required
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                disabled={loading}
                required
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Create Account
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
