import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Project Showcase',
  description: 'Explore real projects built by SkillInf interns. Browse AI, web development, data science projects and see what students have built during their internships.',
  alternates: { canonical: 'https://www.skillinf.in/projects' },
  openGraph: { url: 'https://www.skillinf.in/projects' },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
