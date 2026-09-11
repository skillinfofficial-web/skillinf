import Navbar from "@/components/shared/Navbar";
import HeroSection from "@/components/home/HeroSection";
import InternshipsSection from "@/components/internships/InternshipsSection";
import AchieveSection from "@/components/home/AchieveSection";
import MethodologySection from "@/components/home/MethodologySection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import WhyChooseUsSection from "@/components/home/WhyChooseUsSection";
import ProjectsSection from "@/components/projects/ProjectsSection";
import Footer from "@/components/shared/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <InternshipsSection />
        <AchieveSection />
        <MethodologySection />
        <HowItWorksSection />
        <WhyChooseUsSection />
        <ProjectsSection />
      </main>
      <Footer />
    </>
  );
}
