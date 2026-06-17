"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Trash2, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/landing/Footer";
import ppLogo from "@/assets/pp logo.png";
import Image from "next/image";

const DELETE_EMAIL = "pakplay.co@gmail.com";
const DELETE_MAILTO = `mailto:${DELETE_EMAIL}?subject=${encodeURIComponent("Delete my PakPlay account")}`;

export function DeleteAccountPageClient() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <Link href="/" className="flex items-center">
            <Image src={ppLogo} alt="PakPlay" className="h-10 w-auto" />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Account &amp; Data Deletion</h1>
        <p className="text-lg text-muted-foreground mb-2">PakPlay</p>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 10, 2026</p>

        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-8">
          This page explains how users of the <strong>PakPlay</strong> mobile app and website
          can request deletion of their account and associated personal data. PakPlay is
          Pakistan&apos;s sports venue booking platform operated by PakPlay.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              How to request account deletion
            </h2>
            <Card className="p-6 border-primary/20 bg-primary/5">
              <p className="text-sm sm:text-base text-foreground/80 mb-4">
                To request deletion of your PakPlay account and associated personal data:
              </p>
              <ol className="list-decimal pl-5 space-y-3 text-sm sm:text-base text-foreground/80">
                <li>
                  Send an email to{" "}
                  <a href={DELETE_MAILTO} className="text-primary font-medium hover:underline">
                    {DELETE_EMAIL}
                  </a>{" "}
                  from the email address linked to your PakPlay account.
                </li>
                <li>
                  Use the subject line: <strong>&quot;Delete my PakPlay account&quot;</strong>
                </li>
                <li>
                  Include your <strong>full name</strong> and <strong>registered phone number</strong>{" "}
                  so we can verify your identity.
                </li>
              </ol>
              <div className="mt-6">
                <Button asChild>
                  <a href={DELETE_MAILTO}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email deletion request
                  </a>
                </Button>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-primary" />
              In-app deletion (venue owners)
            </h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              If you are a <strong>venue owner</strong> and are signed in, you may also delete your
              account from{" "}
              <strong>Owner Dashboard → Settings → Delete Account</strong>. This permanently removes
              your account and associated data as described below. You can still use the email
              method above if you cannot access the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              What data is deleted
            </h2>
            <p className="text-sm sm:text-base text-foreground/80 mb-4">
              When your deletion request is processed, we delete or anonymize the following
              data linked to your account:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-foreground/80">
              <li>Account profile (name, email, phone number, role)</li>
              <li>Authentication credentials and login session data</li>
              <li>Venue listings you own (including photos, pricing rules, and offers)</li>
              <li>Bookings associated with your account (as player or venue owner)</li>
              <li>Reviews and review reports linked to your account</li>
              <li>Loyalty tier configuration for venues you manage</li>
              <li>Owner dashboard settings and preferences stored in our database</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">What data may be kept</h2>
            <p className="text-sm sm:text-base text-foreground/80 mb-4">
              We may retain limited information only where required by law or for legitimate
              business purposes:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-foreground/80">
              <li>
                Records of your deletion request and our confirmation email (to demonstrate
                compliance with your request)
              </li>
              <li>
                Aggregated or anonymized analytics that cannot identify you personally
              </li>
              <li>
                Data we are legally required to keep (for example, tax, fraud prevention, or
                dispute resolution), for the minimum period required by applicable law
              </li>
            </ul>
            <p className="text-sm sm:text-base text-foreground/80 mt-4">
              We do not sell your personal data. See our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for more detail.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Processing timeline
            </h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              We will process your deletion request within <strong>30 days</strong> of receiving
              a verified request and will confirm by email when deletion is complete. If we need
              additional information to verify your identity, we will contact you at the email
              address associated with your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Questions</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              For questions about account deletion or your personal data, contact us at{" "}
              <a href={DELETE_MAILTO} className="text-primary hover:underline">
                {DELETE_EMAIL}
              </a>{" "}
              or via our{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact form
              </Link>
              .
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
