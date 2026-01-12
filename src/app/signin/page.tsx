import { Metadata } from "next";
import { SignInPageClient } from "@/components/pages/SignInPageClient";

export const metadata: Metadata = {
  title: "Sign In | PakPlay",
  description: "Sign in to your PakPlay account to manage your venues and bookings.",
};

export default function SignInPage() {
  return <SignInPageClient />;
}

