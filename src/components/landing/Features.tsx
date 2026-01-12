import { Card } from "@/components/ui/card";
import { Clock, Shield, CreditCard, Star, Users, Smartphone } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Instant Booking",
    description: "Book your favorite venue in seconds. No waiting, no hassle. Get instant confirmation.",
    color: "text-primary"
  },
  {
    icon: Shield,
    title: "Verified Venues",
    description: "All venues are verified and quality-checked. Play with confidence at trusted locations.",
    color: "text-accent"
  },
  {
    icon: CreditCard,
    title: "Best Prices",
    description: "Compare prices across multiple venues. Get exclusive deals and special offers.",
    color: "text-primary"
  },
  {
    icon: Star,
    title: "Real Reviews",
    description: "Read authentic reviews from real players. Make informed decisions before booking.",
    color: "text-accent"
  },
  {
    icon: Users,
    title: "Easy Management",
    description: "Manage all your bookings in one place. Reschedule or cancel with just a tap.",
    color: "text-primary"
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Book on the go with our mobile-optimized platform. Play anytime, anywhere.",
    color: "text-accent"
  }
];

export const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Why Choose PakPlay?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to find and book the perfect sports venue
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2"
            >
              <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6 ${feature.color}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

