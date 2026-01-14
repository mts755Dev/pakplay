"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";

export function TermsOfServicePageClient() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <Link href="/" className="text-xl sm:text-2xl font-bold text-primary">
            PakPlay
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8">Last Updated: November 11, 2025</p>

        <div className="prose prose-slate max-w-none space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">1. Agreement to Terms</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              By accessing or using PakPlay's services, you agree to be bound by these Terms of Service and all 
              applicable laws and regulations. If you do not agree with any of these terms, you are prohibited 
              from using or accessing this site. The materials contained in this website are protected by 
              applicable copyright and trademark law.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">2. Use License</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials on PakPlay's website for 
              personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer 
              of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-foreground/80">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on PakPlay's website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">3. User Accounts</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              When you create an account with us, you must provide information that is accurate, complete, and 
              current at all times. Failure to do so constitutes a breach of the Terms, which may result in 
              immediate termination of your account on our Service.
            </p>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              You are responsible for safeguarding the password that you use to access the Service and for any 
              activities or actions under your password. You agree not to disclose your password to any third party. 
              You must notify us immediately upon becoming aware of any breach of security or unauthorized use of 
              your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">4. Booking Terms</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              <strong>For Players:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
              <li>All bookings are subject to availability and confirmation by the venue owner</li>
              <li>Payment must be made in full at the time of booking unless otherwise specified</li>
              <li>Cancellation and refund policies are set by individual venue owners</li>
              <li>You agree to arrive on time and respect the venue's rules and regulations</li>
              <li>Any damage to venue property during your booking period may result in additional charges</li>
            </ul>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              <strong>For Venue Owners:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>You must accurately represent your venue's facilities, availability, and pricing</li>
              <li>You agree to honor all confirmed bookings unless there are extraordinary circumstances</li>
              <li>You are responsible for maintaining your venue in good condition</li>
              <li>You must respond to booking requests within 24 hours</li>
              <li>You agree to pay PakPlay's commission fees as outlined in your subscription plan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">5. Payment Terms</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              PakPlay facilitates payments between players and venue owners. We use third-party payment processors 
              to process payments. By using our services, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Provide current, complete, and accurate payment information</li>
              <li>Promptly update account and payment information when changes occur</li>
              <li>Pay all charges incurred by you or any users of your account at the prices in effect when such charges are incurred</li>
              <li>Accept that PakPlay is not responsible for any payment processing errors or delays caused by third-party payment processors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">6. Cancellation and Refunds</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              Cancellation and refund policies vary by venue. When making a booking, you will be shown the specific 
              cancellation policy that applies. Generally:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Cancellations made 24+ hours before the booking time may be eligible for a full refund</li>
              <li>Cancellations made less than 24 hours before the booking time may incur a cancellation fee</li>
              <li>No-shows are typically not eligible for refunds</li>
              <li>Refunds may take 5-10 business days to process</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">7. User Conduct</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              You agree not to use our services to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Post false, inaccurate, misleading, or fraudulent content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Spam or send unsolicited communications</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Use automated systems to access or use our services without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">8. Reviews and Ratings</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              Users may post reviews and ratings about venues. Reviews must be honest, accurate, and based on 
              personal experience. We reserve the right to remove reviews that violate our guidelines, including 
              reviews that are offensive, fraudulent, or not based on actual experience. Venue owners may respond 
              to reviews but may not offer incentives for positive reviews or penalties for negative reviews.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">9. Intellectual Property</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              The Service and its original content (excluding content provided by users), features and functionality 
              are and will remain the exclusive property of PakPlay and its licensors. The Service is protected by 
              copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection 
              with any product or service without the prior written consent of PakPlay.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">10. Limitation of Liability</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              PakPlay acts as an intermediary between players and venue owners. We are not responsible for the 
              quality, safety, or legality of venues listed, the truth or accuracy of listings, the ability of 
              venue owners to provide services, or the ability of players to pay for services. To the maximum 
              extent permitted by law, PakPlay shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">11. Indemnification</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              You agree to defend, indemnify, and hold harmless PakPlay, its parent company, officers, directors, 
              employees, and agents from and against any claims, liabilities, damages, judgments, awards, losses, 
              costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your 
              violation of these Terms or your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">12. Termination</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              We may terminate or suspend your account and bar access to the Service immediately, without prior 
              notice or liability, under our sole discretion, for any reason whatsoever, including without limitation 
              if you breach the Terms. If you wish to terminate your account, you may simply discontinue using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">13. Governing Law</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              These Terms shall be governed and construed in accordance with the laws of Pakistan, without regard 
              to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall 
              be subject to the exclusive jurisdiction of the courts of Pakistan.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">14. Changes to Terms</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will 
              provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material 
              change will be determined at our sole discretion. By continuing to access or use our Service after 
              any revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">15. Contact Us</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none space-y-2 text-sm sm:text-base text-foreground/80">
              <li className="break-words">Email: <a href="mailto:pakplay.co@gmail.com" className="text-primary hover:underline">pakplay.co@gmail.com</a></li>
              <li>Phone: <a href="https://wa.me/923166742882" className="text-primary hover:underline">+92 316 6742882</a></li>
              <li>Website: <Link href="/contact" className="text-primary hover:underline">Contact Form</Link></li>
            </ul>
          </section>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

