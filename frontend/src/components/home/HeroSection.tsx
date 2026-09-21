import Link from 'next/link';
import styles from './HeroSection.module.css';

const trustPoints = [
  'Virtual Learning',
  'Practical Projects',
  'Verified Certificate',
  'Career Ready',
];

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.container}`}>

        {/* Eyebrow */}
        <p className={styles.eyebrow}>BUILD SKILLS. GAIN EXPERIENCE.</p>

        {/* Main heading */}
        <h1 className={styles.title}>
          Free Virtual Internships<br />
          <span className={styles.titleLine2}>for Students 2026 Batch</span>
        </h1>

        {/* Description */}
        <p className={styles.subtitle}>
          Learn practical skills through real-world projects, complete
          industry-focused tasks, and earn a verified certificate
          to strengthen your resume and career profile.
        </p>

        {/* Batch badge */}
        <div className={styles.badge}>
          <span className={styles.batchDot} aria-hidden="true" />
          Next Batch Starts Soon!
        </div>

        {/* CTA */}
        <Link href="/sign-in" className={styles.ctaButton} id="hero-start-btn">
          Start Your Internship
        </Link>

        {/* Trust points */}
        <div className={styles.trustGrid}>
          {trustPoints.map((pt) => (
            <div key={pt} className={styles.trustItem}>
              <span className={styles.check} aria-hidden="true">✓</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
