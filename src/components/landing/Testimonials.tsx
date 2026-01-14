"use client";

import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ahmed Khan",
    role: "Regular Player",
    location: "Karachi",
    rating: 5,
    text: "PakPlay made booking my weekly futsal games so easy! No more calling multiple venues. Just pick a time slot and you're done. Highly recommend!",
    image: "/testimonials/ahmed-khan.jpg"
  },
  {
    name: "Hassan Ali",
    role: "Badminton Enthusiast",
    location: "Lahore",
    rating: 5,
    text: "As a badminton player, finding quality courts was always a challenge. PakPlay showed me venues I never knew existed. The booking process is seamless!",
    image: "/testimonials/hassan-ali.jpg"
  },
  {
    name: "Hamza Malik",
    role: "Cricket Team Captain",
    location: "Islamabad",
    rating: 5,
    text: "We book our weekend cricket matches through PakPlay. The instant confirmation and verified venues give us peace of mind. Best decision we made!",
    image: "/testimonials/hamza-malik.jpg"
  }
];

const venueOwnerTestimonials = [
  {
    name: "Faisal Ahmed",
    role: "Venue Owner",
    location: "The Arena, Karachi",
    rating: 5,
    text: "Since joining PakPlay, our bookings increased by 60%! The platform is easy to use and the support team is always helpful. It's a game-changer for venue owners.",
    image: "/testimonials/faisal-ahmed.jpg"
  },
  {
    name: "Usman Siddiqui",
    role: "Venue Owner",
    location: "Sports Hub, Lahore",
    rating: 5,
    text: "Managing bookings was a nightmare before PakPlay. Now everything is automated and organized. I can focus on improving my venue instead of managing calendars!",
    image: "/testimonials/usman-siddiqui.jpg"
  }
];

export const Testimonials = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Players Testimonials */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Loved by Players
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what players across Pakistan are saying about us
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 relative"
              >
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10">
                  <Quote className="w-12 h-12 text-primary" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full bg-muted object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + testimonial.name;
                    }}
                  />
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.location}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Venue Owners Testimonials */}
        <div>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Trusted by Venue Owners
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join successful venues growing their business with PakPlay
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {venueOwnerTestimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 relative bg-gradient-to-br from-muted/50 to-background"
              >
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10">
                  <Quote className="w-12 h-12 text-accent" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full bg-muted object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + testimonial.name;
                    }}
                  />
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-accent font-medium">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

