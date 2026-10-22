import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import AnnouncementBar from '@/components/home/AnnouncementBar';
import Footer from '@/components/shared/Footer';
import LiveRegistrationPopup from '@/components/home/LiveRegistrationPopup';
import NewHomePage from '@/components/home/NewHomePage';

/* ── Page-level SEO ─────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'SkillInf | Premium Digital Services & Virtual Internships for Students',
  description:
    'SkillInf delivers premium website development, AI automation, UI/UX design, and 3D rendering for businesses — plus free virtual internship programs helping students build real skills and careers.',
  keywords: [
    'digital agency India', 'website development', 'AI automation', 'UI UX design agency',
    '3D rendering services', 'free virtual internship', 'student internship online',
    'internship certificate', 'practical skills for students', 'career ready',
    'web development internship', 'data science internship', 'AI internship', 'skillinf',
  ],
  alternates: {
    canonical: 'https://www.skillinf.in/',
  },
  openGraph: {
    title: 'SkillInf | Premium Digital Services & Virtual Internships',
    description:
      'We build premium digital products for businesses and run free virtual internship programs for students. Website development, AI automation, UI/UX design, 3D rendering.',
    url: 'https://www.skillinf.in/',
    type: 'website',
    images: [{ url: 'https://www.skillinf.in/og-image.png', width: 1200, height: 630, alt: 'SkillInf' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillInf | Premium Digital Services & Virtual Internships',
    description:
      'Website development, AI automation, UI/UX design, 3D rendering + free virtual internships for students.',
    images: ['https://www.skillinf.in/og-image.png'],
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <AnnouncementBar />
      <main>
        <NewHomePage />
      </main>
      <Footer />
      <LiveRegistrationPopup />
    </>
  );
}
