'use client';

import { useState } from 'react';
import ApplyModal from './ApplyModal';
import styles from './ApplyNowButton.module.css';

interface Props {
  itemName: string;
  itemType: 'internship' | 'program';
  itemId: string;
  /** Optional variant for sizing inside different layouts */
  variant?: 'default' | 'sidebar' | 'mobile';
}

export default function ApplyNowButton({ itemName, itemType, itemId, variant = 'default' }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={`${styles.btn} ${styles[variant]}`}
        onClick={() => setOpen(true)}
        id={`apply-now-${variant}-${itemId}`}
      >
        Apply Now
      </button>

      <ApplyModal
        isOpen={open}
        onClose={() => setOpen(false)}
        itemName={itemName}
        itemType={itemType}
        itemId={itemId}
      />
    </>
  );
}
