import styles from './AnnouncementBar.module.css';
import Link from 'next/link';

const MESSAGE = '🎓 Registrations Open — Next Internship Batch Starting Soon · Register Now → · Apply Before Slots End · 🎓 Registrations Open — Next Internship Batch Starting Soon · Register Now → · Apply Before Slots End ·';

export default function AnnouncementBar() {
  return (
    <div className={styles.bar} role="marquee" aria-label="Announcement">
      <div className={styles.track}>
        <span className={styles.text}>{MESSAGE}</span>
        <span className={styles.text} aria-hidden="true">{MESSAGE}</span>
      </div>
      <div className={styles.overlay} />
      <Link href="/sign-up" className={styles.pill}>Register Now</Link>
    </div>
  );
}
