// Server Component - Static content, zero JavaScript bundle
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { StaticPageNav } from "@/components/shared/StaticPageNav";

const plans = [
  {
    name: "Standard Plan",
    price: "PKR 999",
    period: "per month",
    onboardingFee: "PKR 5,000",
    description: "Everything you need to grow your sports venue business",
    features: [
      "List unlimited venues",
      "Advanced analytics & insights",
      "WhatsApp notifications",
      "Priority support",
      "Automated booking management",
      "Real-time availability updates",
      "Customer review management"
    ],
    cta: "Get Started",
    highlighted: true
  }
];

export function PricingPageContent() {
  return (
    <div className="min-h-screen">
      <StaticPageNav activePage="pricing" />

      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-lg text-secondary-foreground/90 max-w-2xl mx-auto">
            One straightforward plan with everything you need to manage and grow your sports venue business.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 sm:py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className="p-4 sm:p-6 md:p-8 border-primary border-2 shadow-xl"
              >
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center">{plan.name}</h3>
                <div className="text-center mb-4 sm:mb-6">
                  <div className="mb-2 sm:mb-3">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground ml-1 sm:ml-2 text-sm sm:text-base md:text-lg">/ {plan.period}</span>
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">
                    <span className="font-semibold">+ {plan.onboardingFee}</span> one-time onboarding fee
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-center text-sm sm:text-base md:text-lg">{plan.description}</p>
                <Link href="/signup">
                  <Button 
                    className="w-full mb-6 sm:mb-8 text-base sm:text-lg py-5 sm:py-6"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">What&apos;s included:</h4>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Questions About Pricing?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Visit our FAQ page or contact our sales team for more information
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/faq">
                <Button variant="outline" size="lg">
                  View FAQs
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



