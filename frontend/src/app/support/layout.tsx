import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Support',
  description: 'Get help from the SkillInf support team. Contact us for questions about internship enrollment, certificates, payments, or any other queries.',
  alternates: { canonical: 'https://www.skillinf.in/support' },
  openGraph: { url: 'https://www.skillinf.in/support' },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
