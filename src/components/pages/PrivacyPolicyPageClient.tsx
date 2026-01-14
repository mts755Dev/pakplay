"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import ppLogo from "@/assets/pp logo.png";
import Image from "next/image";

export function PrivacyPolicyPageClient() {
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
          <Link href="/" className="flex items-center">
            <Image src={ppLogo} alt="PakPlay" className="h-10 w-auto" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8">Last Updated: November 11, 2025</p>

        <div className="prose prose-slate max-w-none space-y-6 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">1. Introduction</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              Welcome to PakPlay. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit 
              our website or use our services and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">2. Information We Collect</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              We may collect, use, store and transfer different kinds of personal data about you:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-foreground/80">
              <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
              <li><strong>Financial Data:</strong> includes payment card details.</li>
              <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of bookings you have made.</li>
              <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, operating system and platform.</li>
              <li><strong>Profile Data:</strong> includes your username and password, bookings made by you, your interests, preferences, feedback and survey responses.</li>
              <li><strong>Usage Data:</strong> includes information about how you use our website and services.</li>
              <li><strong>Marketing and Communications Data:</strong> includes your preferences in receiving marketing from us and your communication preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">3. How We Use Your Information</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>To process and deliver your venue bookings</li>
              <li>To manage payments, fees, and charges</li>
              <li>To collect and recover money owed to us</li>
              <li>To manage our relationship with you</li>
              <li>To improve our website and services</li>
              <li>To deliver relevant content and advertisements to you</li>
              <li>To make recommendations about venues or services that may be of interest to you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">4. Data Security</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              We have put in place appropriate security measures to prevent your personal data from being accidentally 
              lost, used or accessed in an unauthorized way, altered or disclosed. We use industry-standard encryption 
              for all sensitive data transmission and storage. We limit access to your personal data to those employees, 
              agents, contractors and other third parties who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">5. Data Retention</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              We will only retain your personal data for as long as necessary to fulfil the purposes we collected it for, 
              including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the 
              appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal 
              data, the potential risk of harm from unauthorized use or disclosure, and the applicable legal requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">6. Your Legal Rights</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">7. Third-Party Links</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              Our website may include links to third-party websites, plug-ins and applications. Clicking on those links 
              or enabling those connections may allow third parties to collect or share data about you. We do not control 
              these third-party websites and are not responsible for their privacy statements.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">8. Cookies</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              We use cookies and similar tracking technologies to track the activity on our website and hold certain information. 
              Cookies are files with small amount of data which may include an anonymous unique identifier. You can instruct 
              your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, 
              you may not be able to use some portions of our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy. You are 
              advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">10. Contact Us</h2>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
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

