import { Metadata } from "next";
import { SignInPageClient } from "@/components/pages/SignInPageClient";

export const metadata: Metadata = {
  title: "Sign In | PakPlay",
  description: "Sign in to your PakPlay account to manage your venues and bookings.",
};

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return <SignInPageClient />;
}

