import React from 'react';
import { Plus, X } from 'lucide-react';
import styles from '../AddContentForm.module.css';

interface ProjectsBuildSectionProps {
  projects: string[];
  onChange: (projects: string[]) => void;
  error?: string;
}

export default function ProjectsBuildSection({ projects, onChange, error }: ProjectsBuildSectionProps) {
  const update = (index: number, value: string) => {
    const next = [...projects];
    next[index] = value;
    onChange(next);
  };

  const add = () => onChange([...projects, '']);
  const remove = (index: number) => onChange(projects.filter((_, i) => i !== index));

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Projects You&apos;ll Build <span className={styles.required}>*</span></h2>
      <p className={styles.cardSubtitle}>First 2 are mandatory. Add more as needed.</p>

      <div className={styles.listInputs}>
        {projects.map((project, i) => (
          <div key={i} className={styles.listRow}>
            <span className={styles.listNum}>{i + 1}.</span>
            <input
              type="text"
              className={styles.input}
              value={project}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`Project ${i + 1}`}
            />
            {i >= 2 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => remove(i)}
                aria-label="Remove project"
              >
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {projects.length < 8 && (
        <button type="button" className={styles.addBtn} onClick={add}>
          <Plus size={16} /> Add Project
        </button>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
