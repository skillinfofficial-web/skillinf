import ContentTable from '@/components/admin/ContentTable';

export const metadata = {
  title: 'Internships | SkillInf Admin',
};

export default function InternshipsPage() {
  return <ContentTable type="internship" title="Internships" />;
}
