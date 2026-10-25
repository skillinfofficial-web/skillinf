import Navbar from '@/components/shared/Navbar';
import HeroSection from '@/components/home/HeroSection';
import StatsStrip from '@/components/home/StatsStrip';
import PopularDomainsSection from '@/components/home/PopularDomainsSection';
import VerifyCertificateSection from '@/components/home/VerifyCertificateSection';
import InternshipsSection from '@/components/internships/InternshipsSection';
import AchieveSection from '@/components/home/AchieveSection';
import MethodologySection from '@/components/home/MethodologySection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection';
import ProjectsSection from '@/components/projects/ProjectsSection';
import Footer from '@/components/shared/Footer';

export default function InternshipsPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsStrip />
        <PopularDomainsSection />
        <VerifyCertificateSection />
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
