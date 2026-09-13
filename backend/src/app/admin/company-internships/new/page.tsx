import React from 'react';
import CompanyInternshipForm from '@/components/CompanyInternshipForm';
import styles from '../../add/add.module.css';

export const metadata = {
  title: 'Add Company Internship | SkillInf Admin',
  description: 'Create a structured company internship with 4-week learning content.',
};

export default function NewCompanyInternshipPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Add Company Internship</h1>
        <p className={styles.description}>
          Create a structured company internship with weekly learning content, tutorials and key features.
        </p>
      </header>
      <CompanyInternshipForm />
    </div>
  );
}
