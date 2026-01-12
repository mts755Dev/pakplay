import { Metadata } from "next";
import { TermsOfServicePageClient } from "@/components/pages/TermsOfServicePageClient";

export const metadata: Metadata = {
  title: "Terms of Service | PakPlay",
  description: "PakPlay's terms of service - rules and guidelines for using our platform.",
};

export default function TermsPage() {
  return <TermsOfServicePageClient />;
}

