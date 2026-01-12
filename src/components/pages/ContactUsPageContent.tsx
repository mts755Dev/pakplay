// Server Component - Static content with Client Component form
import { Footer } from "@/components/landing/Footer";
import { StaticPageNav } from "@/components/shared/StaticPageNav";
import { ContactFormClient } from "./ContactFormClient";

export function ContactUsPageContent() {
  return (
    <div className="min-h-screen">
      <StaticPageNav activePage="contact" />

      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Get in Touch
          </h1>
          <p className="text-base sm:text-lg text-secondary-foreground/90 max-w-2xl mx-auto">
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <ContactFormClient />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



