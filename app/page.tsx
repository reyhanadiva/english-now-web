import { Hero } from "@/components/hero";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ProgramSection } from "@/components/program-section";
import { StartSection } from "@/components/start-section";
import { TestimonialSection } from "@/components/testimonial-section";
import { TeachersSection } from "@/components/teachers-section";
import { LevelSection } from "@/components/level-section";
import { WhySection } from "@/components/why-section";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhySection />
        <TeachersSection />
        <LevelSection />
        <ProgramSection />
        <TestimonialSection />
        <FaqSection />
        <StartSection />
      </main>
      <Footer />
    </>
  );
}
