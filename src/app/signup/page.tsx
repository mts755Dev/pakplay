import { Metadata } from "next";
import { SignUpPageClient } from "@/components/pages/SignUpPageClient";

export const metadata: Metadata = {
  title: "Create Account | PakPlay",
  description: "Create your PakPlay account. Sign up as a player to book venues or as a venue owner to list your sports facilities.",
};

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return <SignUpPageClient />;
}
