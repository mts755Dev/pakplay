import { Metadata } from "next";
import { SignUpPageClient } from "@/components/pages/SignUpPageClient";

export const metadata: Metadata = {
  title: "List Your Venue | PakPlay",
  description: "Join PakPlay and start receiving bookings for your sports venue. Quick signup, instant approval.",
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}

