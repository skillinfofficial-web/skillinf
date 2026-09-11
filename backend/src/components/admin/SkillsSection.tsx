import React from 'react';
import { Plus, X } from 'lucide-react';
import styles from '../AddContentForm.module.css';

interface SkillsSectionProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  error?: string;
}

export default function SkillsSection({ skills, onChange, error }: SkillsSectionProps) {
  const update = (index: number, value: string) => {
    const next = [...skills];
    next[index] = value;
    onChange(next);
  };

  const add = () => onChange([...skills, '']);
  const remove = (index: number) => onChange(skills.filter((_, i) => i !== index));

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Skills You&apos;ll Learn <span className={styles.required}>*</span></h2>
      <p className={styles.cardSubtitle}>First 3 are mandatory. Add more as needed.</p>

      <div className={styles.listInputs}>
        {skills.map((skill, i) => (
          <div key={i} className={styles.listRow}>
            <span className={styles.listNum}>{i + 1}.</span>
            <input
              type="text"
              className={styles.input}
              value={skill}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`Skill ${i + 1}`}
            />
            {i >= 3 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => remove(i)}
                aria-label="Remove skill"
              >
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {skills.length < 10 && (
        <button type="button" className={styles.addBtn} onClick={add}>
          <Plus size={16} /> Add Skill
        </button>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
