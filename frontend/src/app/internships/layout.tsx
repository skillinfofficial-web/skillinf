import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internship Programs',
  description: 'Browse all skillinf virtual internship programs in AI, Machine Learning, Web Development, Data Science, Cybersecurity, and more. Enroll for free and earn a certificate.',
  alternates: { canonical: 'https://www.skillinf.in/internships' },
  openGraph: { url: 'https://www.skillinf.in/internships' },
};

export default function InternshipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
