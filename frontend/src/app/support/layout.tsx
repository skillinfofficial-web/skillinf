import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Help & Support Center — skillinf' },
  description: 'Get help from the skillinf team. Contact us for questions about internship enrollment, certificates, or payments.',
  alternates: { canonical: 'https://www.skillinf.in/support' },
  openGraph: { url: 'https://www.skillinf.in/support' },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
