import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Online Internship Programs — SkillInf' },
  description: 'Explore SkillInf training programs in AI, Web Development, Data Science and more. Build practical, job-ready skills with guided projects.',
  alternates: { canonical: 'https://www.skillinf.in/programs' },
  openGraph: { url: 'https://www.skillinf.in/programs' },
};

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
