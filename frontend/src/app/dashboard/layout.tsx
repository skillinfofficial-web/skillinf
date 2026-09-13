import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | SkillInf',
  description: 'Your SkillInf internship dashboard — track your progress, submit work, and unlock your certificate.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
