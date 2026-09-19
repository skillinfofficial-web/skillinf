import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Free Internship Sign Up — Join SkillInf Today' },
  description: 'Create a free SkillInf account and enroll in a virtual internship in AI, Web Dev, or Data Science. Start your free journey today.',
  alternates: { canonical: 'https://www.skillinf.in/sign-up' },
  openGraph: { url: 'https://www.skillinf.in/sign-up' },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
