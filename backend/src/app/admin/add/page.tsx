import React from 'react';
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
        <h1 className={styles.title}>Add New Content</h1>
        <p className={styles.description}>
          Create and publish an internship, program, or project for SkillInf.
        </p>
      </header>
      <AddContentForm />
    </div>
  );
}
