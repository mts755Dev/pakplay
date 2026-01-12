import { Metadata } from "next";
import { PrivacyPolicyPageClient } from "@/components/pages/PrivacyPolicyPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy | PakPlay",
  description: "PakPlay's privacy policy - how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageClient />;
}

