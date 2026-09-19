import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Internship Dashboard',
  description: 'Access your skillinf internship dashboard to track progress, complete course steps, and download your certificate.',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
