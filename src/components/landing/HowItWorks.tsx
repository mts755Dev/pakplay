"use client";

import { Search, Calendar, Play, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Search,
    title: "Find Your Venue",
    description: "Browse hundreds of verified sports venues across Pakistan. Filter by location, sport, and price.",
    step: "1"
  },
  {
    icon: Calendar,
    title: "Pick Date & Time",
    description: "Select your preferred date and time slot. Check real-time availability instantly.",
    step: "2"
  },
  {
    icon: CheckCircle2,
    title: "Confirm Booking",
    description: "Review your booking details and confirm. Get instant confirmation via WhatsApp and email.",
    step: "3"
  },
  {
    icon: Play,
    title: "Show Up & Play",
    description: "Arrive at the venue at your scheduled time. Show your booking confirmation and start playing!",
    step: "4"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Book your perfect venue in 4 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection Lines for desktop */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-20" style={{ top: '60px' }} />
          
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="relative p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background"
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {step.step}
                </div>
              </div>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 mt-4">
                <step.icon className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

