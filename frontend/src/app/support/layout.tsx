import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Help & Support Centre | Skillinf' },
  description: 'Get help from the Skillinf support team. Contact us for questions about internship enrolment, certificates, or payments.',
  alternates: { canonical: 'https://www.skillinf.in/support' },
  openGraph: { url: 'https://www.skillinf.in/support' },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
