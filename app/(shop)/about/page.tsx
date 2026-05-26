import AboutHero from "./components/AboutHero";
import AboutStats from "./components/AboutStats";
import OurStory from "./components/OurStory";
import WhyChooseUs from "./components/WhyChooseUs";
import OurValues from "./components/OurValues";
import TeamSection from "./components/TeamSection";
import Testimonials from "./components/Testimonials";
import AboutCTA from "./components/AboutCTA";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-10 sm:space-y-14">
        <AboutHero />
        <AboutStats />
        <OurStory />
        <WhyChooseUs />
        <OurValues />
        <TeamSection />
        <Testimonials />
        <AboutCTA />
      </div>
    </div>
  );
}
