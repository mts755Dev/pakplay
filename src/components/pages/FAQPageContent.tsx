// Server Component - Static content, zero JavaScript bundle
import { Footer } from "@/components/landing/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StaticPageNav } from "@/components/shared/StaticPageNav";

const faqs = [
  {
    question: "How do I book a venue?",
    answer: "Browse available venues, select your preferred date and time, and complete the booking process. You'll receive instant confirmation via WhatsApp and email."
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer: "Yes, you can cancel or reschedule bookings up to 24 hours before your scheduled time. Contact the venue directly through WhatsApp for assistance."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including credit/debit cards, mobile wallets, and cash payments at the venue. Payment options vary by venue."
  },
  {
    question: "How do I list my venue on PakPlay?",
    answer: "Click on 'List Your Venue' button, create an account, and fill in your venue details. Our team will review and approve your listing within 24-48 hours."
  },
  {
    question: "Is there a commission fee for venue owners?",
    answer: "Yes, we charge a small commission on each booking to maintain the platform and provide customer support. Check our Pricing page for detailed information."
  },
  {
    question: "What sports does PakPlay support?",
    answer: "We support a wide range of sports including Padel, Cricket, Futsal, Badminton, Tennis, Basketball, and many more. Check our Browse by Sport section on the homepage."
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach us via WhatsApp, email, or through the contact form on our website. We typically respond within a few hours during business hours."
  },
  {
    question: "Are the venues verified?",
    answer: "Yes, all venues listed on PakPlay are verified by our team to ensure quality and authenticity. We also display ratings and reviews from real users."
  },
  {
    question: "Can I get a refund if the venue is unavailable?",
    answer: "Yes, if a venue becomes unavailable due to unforeseen circumstances, you'll receive a full refund or can reschedule at no extra cost."
  },
  {
    question: "How does dynamic pricing work?",
    answer: "Some venues offer dynamic pricing based on demand, time of day, and day of the week. Peak hours may have higher rates, while off-peak times offer discounts."
  }
];

export function FAQPageContent() {
  return (
    <div className="min-h-screen">
      <StaticPageNav activePage="faq" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary via-secondary to-secondary/90 text-secondary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-secondary-foreground/90 max-w-2xl mx-auto">
            Find answers to common questions about booking venues and using PakPlay
          </p>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



