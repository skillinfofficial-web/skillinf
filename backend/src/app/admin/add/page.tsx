import React from 'react';
import Link from 'next/link';
import AddContentForm from '@/components/AddContentForm';
import styles from './add.module.css';

export const metadata = {
  title: 'Add Content | SkillInf Admin',
  description: 'Create and publish an internship, program, or project.',
};

export default function AddContentPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Content Management</h1>
            <p className={styles.description}>
              Create and publish an internship, program, or project for SkillInf.
            </p>
          </div>
          <Link href="/admin/company-internships/new" className={styles.addCompanyBtn}>
            + Add Company Internship
          </Link>
        </div>
      </header>
      <AddContentForm />
    </div>
  );
}
