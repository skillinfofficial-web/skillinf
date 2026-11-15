import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Virtual Internship Programs | Skillinf',
  description: 'Browse Skillinf virtual internship programs in AI, Web Development, Data Science, Cybersecurity and more. Enroll free and earn a verified certificate.',
  alternates: { canonical: 'https://www.skillinf.in/internships' },
  openGraph: { url: 'https://www.skillinf.in/internships' },
};

export default function InternshipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
