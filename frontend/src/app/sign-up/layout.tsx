import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up — Join a Free Internship',
  description: 'Create your SkillInf account and enroll in a free virtual internship program in AI, Web Development, Data Science, and more. Start building your career today.',
  alternates: { canonical: 'https://www.skillinf.in/sign-up' },
  openGraph: { url: 'https://www.skillinf.in/sign-up' },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
