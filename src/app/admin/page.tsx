import { Metadata } from "next";
import { AdminLoginClient } from "@/components/pages/admin/AdminLoginClient";

export const metadata: Metadata = {
  title: "Admin Login | PakPlay",
  description: "Administrator access to PakPlay platform.",
};

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}

