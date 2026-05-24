import ContactHero from "./components/ContactHero";
import ContactInfoCards from "./components/ContactInfoCards";
import ContactForm from "./components/ContactForm";
import ContactMap from "./components/ContactMap";
import FAQSection from "./components/FAQSection";
import SocialConnect from "./components/SocialConnect";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-10 sm:space-y-14">
        <ContactHero />
        <ContactInfoCards />
        <ContactForm />
        <ContactMap />
        <FAQSection />
        <SocialConnect />
      </div>
    </div>
  );
}
