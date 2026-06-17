import { Metadata } from "next";
import { DeleteAccountPageClient } from "@/components/pages/DeleteAccountPageClient";

export const metadata: Metadata = {
  title: "Account & Data Deletion | PakPlay",
  description:
    "Request deletion of your PakPlay account and personal data. Steps, data removed, retention policy, and contact information.",
  alternates: {
    canonical: "https://pakplay.co/delete-account",
  },
  openGraph: {
    title: "Account & Data Deletion | PakPlay",
    description:
      "How to request deletion of your PakPlay account and associated personal data.",
    url: "https://pakplay.co/delete-account",
    siteName: "PakPlay",
  },
};

export default function DeleteAccountPage() {
  return <DeleteAccountPageClient />;
}
