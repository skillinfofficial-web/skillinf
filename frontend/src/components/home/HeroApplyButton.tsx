'use client';

import { useState } from 'react';
import ApplyModal from '@/components/catalog/ApplyModal';
import styles from './HeroSection.module.css';

export default function HeroApplyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={styles.primaryButton}
        id="hero-apply-btn"
        onClick={() => setOpen(true)}
      >
        Get Certificate
      </button>

      <ApplyModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
