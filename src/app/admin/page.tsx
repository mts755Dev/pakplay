import { Metadata } from "next";
import { AdminLoginClient } from "@/components/pages/admin/AdminLoginClient";

export const metadata: Metadata = {
  title: "Admin Login | PakPlay",
  description: "Administrator access to PakPlay platform.",
};

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}

