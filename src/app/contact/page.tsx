import { Metadata } from "next";
import { ContactUsPageContent } from "@/components/pages/ContactUsPageContent";

export const metadata: Metadata = {
  title: "Contact PakPlay | Get In Touch With Our Team",
  description: "Get in touch with PakPlay. We're here to help with any questions about venue bookings, partnerships, or listing your sports facility. Available via phone, email, and WhatsApp.",
  keywords: ["contact pakplay", "customer support", "venue inquiry", "partnership"],
  openGraph: {
    title: "Contact PakPlay | Get In Touch With Our Team",
    description: "Get in touch with PakPlay for venue bookings, partnerships, or any questions.",
    type: "website",
  },
};

// Server Component - SSR by default
export default function ContactPage() {
  return <ContactUsPageContent />;
}

