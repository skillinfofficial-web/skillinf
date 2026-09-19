import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Training Programs',
  description: 'Explore SkillInf training programs designed to build practical, job-ready skills. Choose from AI, Web Development, Data Science, and more structured learning paths.',
  alternates: { canonical: 'https://www.skillinf.in/programs' },
  openGraph: { url: 'https://www.skillinf.in/programs' },
};

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
