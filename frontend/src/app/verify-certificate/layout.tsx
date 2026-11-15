import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Verify Skillinf Certificate | Skillinf' },
  description: 'Verify your Skillinf internship certificate online. Enter your certificate ID to confirm its authenticity instantly.',
  alternates: { canonical: 'https://www.skillinf.in/verify-certificate' },
  openGraph: { url: 'https://www.skillinf.in/verify-certificate' },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
