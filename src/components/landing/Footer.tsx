"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone } from "lucide-react";
import ppLogo from "@/assets/pp logo.png";

export const Footer = () => {
  return (
    <footer>
      {/* Top Section - White Background (Logo & Social) */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl">
            <Link href="/" className="inline-block mb-4">
              <img src={ppLogo.src} alt="PakPlay" className="h-16 w-auto" />
            </Link>
            <p className="text-gray-900 font-medium mb-2 text-lg">
              Where Pakistan Plays
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Pakistan's leading sports venue booking platform. Find and book the perfect venue for your game in seconds.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <a 
                href="https://facebook.com/pakplay" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Visit our Facebook page"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="https://instagram.com/pakplay" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Visit our Instagram page"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="https://twitter.com/pakplay" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Visit our Twitter page"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Blue Background (Links & Info) */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="py-12 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Players Column */}
            <div>
              <h2 className="font-bold mb-6 text-lg">For Players</h2>
              <ul className="space-y-3 text-secondary-foreground/80">
                <li>
                  <Link href="/venues" className="hover:text-secondary-foreground transition-colors">
                    Browse Venues
                  </Link>
                </li>
                <li>
                  <Link href="/offers" className="hover:text-secondary-foreground transition-colors">
                    Offers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Owners Column */}
            <div>
              <h2 className="font-bold mb-6 text-lg">For Owners</h2>
              <ul className="space-y-3 text-secondary-foreground/80">
                <li>
                  <Link href="/signup" className="hover:text-secondary-foreground transition-colors">
                    List Your Venue
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-secondary-foreground transition-colors">
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-secondary-foreground transition-colors">
                    Owner Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h2 className="font-bold mb-6 text-lg">Company</h2>
              <ul className="space-y-3 text-secondary-foreground/80">
                <li>
                  <Link href="/about" className="hover:text-secondary-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-secondary-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/delete-account" className="hover:text-secondary-foreground transition-colors">
                    Delete Account
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-secondary-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Us Column */}
            <div>
              <h2 className="font-bold mb-6 text-lg">Contact Us</h2>
              <ul className="space-y-3 text-secondary-foreground/80">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:pakplay.co@gmail.com" className="hover:text-secondary-foreground transition-colors">
                    pakplay.co@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="https://wa.me/923166742882" className="hover:text-secondary-foreground transition-colors">
                    +92 316 6742882
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-secondary-foreground/20 py-8">
            <div className="flex justify-center items-center text-secondary-foreground/60">
              <p>&copy; 2025 PakPlay. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
