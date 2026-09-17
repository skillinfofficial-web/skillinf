'use client';

import { useState, useEffect } from 'react';
import styles from './AnnouncementBar.module.css';
import Link from 'next/link';

const DEFAULT_MESSAGE =
  '🎓 Registrations Open — Next Internship Batch Starting Soon · Register Now → · Apply Before Slots End · 🎓 Registrations Open — Next Internship Batch Starting Soon · Register Now → · Apply Before Slots End ·';

export default function AnnouncementBar() {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [enabled, setEnabled] = useState(true);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    fetch('/api/announcement')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          // Duplicate the text so the marquee loops seamlessly
          const text = d.message || DEFAULT_MESSAGE;
          setMessage(`${text} · ${text} ·`);
          setEnabled(d.enabled !== false);
        }
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setLoaded(true));
  }, []);

  // Don't render until we know whether it's enabled (avoids flash)
  if (loaded && !enabled) return null;

  return (
    <div className={styles.bar} role="marquee" aria-label="Announcement">
      <div className={styles.track}>
        <span className={styles.text}>{message}</span>
        <span className={styles.text} aria-hidden="true">{message}</span>
      </div>
      <div className={styles.overlay} />
      <Link href="/sign-up" className={styles.pill}>Register Now</Link>
    </div>
  );
}
