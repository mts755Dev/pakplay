import { Metadata } from "next";
import { FAQPageContent } from "@/components/pages/FAQPageContent";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | PakPlay Help Center",
  description: "Find answers to frequently asked questions about PakPlay - venue booking process, pricing, cancellations, payments, and more. Get help with your sports facility bookings.",
  keywords: ["pakplay faq", "booking help", "venue booking questions", "sports facility faq"],
  openGraph: {
    title: "Frequently Asked Questions | PakPlay",
    description: "Find answers to common questions about booking sports venues on PakPlay.",
    type: "website",
  },
};

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

// Server Component - SSR by default
export default function FAQPage() {
  return <FAQPageContent />;
}

