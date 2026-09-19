import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Verify Your skillinf Certificate Online' },
  description: 'Verify the authenticity of a skillinf internship certificate. Enter your certificate ID to confirm its validity instantly.',
  alternates: { canonical: 'https://www.skillinf.in/verify-certificate' },
  openGraph: { url: 'https://www.skillinf.in/verify-certificate' },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
