import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Student Project Showcase — skillinf Interns' },
  description: 'Browse real projects built by skillinf interns in AI, web development, and data science. See what students build during their internship.',
  alternates: { canonical: 'https://www.skillinf.in/projects' },
  openGraph: { url: 'https://www.skillinf.in/projects' },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
