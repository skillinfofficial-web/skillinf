import ContentTable from '@/components/admin/ContentTable';

export const metadata = {
  title: 'Programs | SkillInf Admin',
};

export default function ProgramsPage() {
  return <ContentTable type="program" title="Programs" />;
}
