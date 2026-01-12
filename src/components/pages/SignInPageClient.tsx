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
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      console.log('Starting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', { data, error });

      if (error) throw error;

      if (data.user) {
        console.log('User signed in:', data.user.id);
        // Check user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        console.log('User profile:', profile);

        // Block admins from signing in here
        if (profile?.role === 'admin') {
          await supabase.auth.signOut();
          toast.error("Admins must sign in at /admin");
          setLoading(false);
          return;
        }

        toast.success("Welcome back!");
        console.log('Redirecting to dashboard...');
        
        // Give a small delay to ensure session is saved, then redirect
        setTimeout(() => {
          window.location.href = '/owner/dashboard';
        }, 100);
        
        // Keep loading state to prevent UI flicker
        return;
      }
    } catch (error: any) {
      setLoading(false);
      // Handle network errors and authentication errors with consistent messaging
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
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
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

          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Create venue owner account
              </Link>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              <Link href="/" className="text-primary hover:underline">
                ← Back to Home Page
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

