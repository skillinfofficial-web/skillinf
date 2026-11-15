import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Free Internship Sign Up | Join Skillinf Today' },
  description: 'Create a free Skillinf account today and enrol in a virtual internship in AI, Web Dev, or Data Science. Start your learning journey.',
  alternates: { canonical: 'https://www.skillinf.in/sign-up' },
  openGraph: { url: 'https://www.skillinf.in/sign-up' },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
