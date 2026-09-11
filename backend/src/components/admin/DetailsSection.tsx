import React from 'react';
import styles from '../AddContentForm.module.css';

interface DetailsSectionProps {
  duration: string;
  time: string;
  teachingSection: string;
  projectCount: string;
  mentorship: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function DetailsSection({
  duration, time, teachingSection, projectCount, mentorship, errors, onChange,
}: DetailsSectionProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Internship Details</h2>

      <div className={styles.twoCol}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Duration <span className={styles.required}>*</span></label>
          <div className={styles.unitInput}>
            <input
              type="number"
              min="1"
              className={`${styles.input} ${errors.duration ? styles.inputError : ''}`}
              value={duration}
              onChange={(e) => onChange('duration', e.target.value)}
              placeholder="8"
            />
            <span className={styles.unit}>weeks</span>
          </div>
          {errors.duration && <p className={styles.errorText}>{errors.duration}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Time <span className={styles.required}>*</span></label>
          <div className={styles.unitInput}>
            <input
              type="number"
              min="1"
              className={`${styles.input} ${errors.time ? styles.inputError : ''}`}
              value={time}
              onChange={(e) => onChange('time', e.target.value)}
              placeholder="10"
            />
            <span className={styles.unit}>hours/week</span>
          </div>
          {errors.time && <p className={styles.errorText}>{errors.time}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Teaching Section</label>
          <select
            className={styles.select}
            value={teachingSection}
            onChange={(e) => onChange('teachingSection', e.target.value)}
          >
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Project Count <span className={styles.required}>*</span></label>
          <div className={styles.unitInput}>
            <input
              type="number"
              min="1"
              className={`${styles.input} ${errors.projectCount ? styles.inputError : ''}`}
              value={projectCount}
              onChange={(e) => onChange('projectCount', e.target.value)}
              placeholder="3"
            />
            <span className={styles.unit}>projects</span>
          </div>
          {errors.projectCount && <p className={styles.errorText}>{errors.projectCount}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Mentorship</label>
          <select
            className={styles.select}
            value={mentorship}
            onChange={(e) => onChange('mentorship', e.target.value)}
          >
            <option value="Available">Available</option>
            <option value="Not Available">Not Available</option>
          </select>
        </div>
      </div>
    </div>
  );
}
