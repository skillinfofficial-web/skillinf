import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your SkillInf Account',
  description: 'Sign in to access your SkillInf internship dashboard, track course steps, and download your certificate.',
  alternates: { canonical: 'https://www.skillinf.in/sign-in' },
  openGraph: { url: 'https://www.skillinf.in/sign-in' },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
