import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Certificate',
  description: 'Verify the authenticity of a SkillInf internship completion certificate. Enter your certificate ID to confirm its validity.',
  alternates: { canonical: 'https://www.skillinf.in/verify-certificate' },
  openGraph: { url: 'https://www.skillinf.in/verify-certificate' },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
