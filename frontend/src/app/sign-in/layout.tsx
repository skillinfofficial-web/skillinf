import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your SkillInf account to access your internship dashboard, course steps, and download your completion certificate.',
  alternates: { canonical: 'https://www.skillinf.in/sign-in' },
  robots: { index: false, follow: false }, // login pages should not be indexed
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
