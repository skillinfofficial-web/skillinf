import ContentTable from '@/components/admin/ContentTable';

export const metadata = {
  title: 'Projects | SkillInf Admin',
};

export default function ProjectsPage() {
  return <ContentTable type="project" title="Projects" />;
}
