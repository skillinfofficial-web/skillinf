import Link from "next/link";
import { CheckCircle } from "lucide-react";
import styles from "./HeroSection.module.css";
import HeroApplyButton from "./HeroApplyButton";

export default function HeroSection() {
  return (
    <section className={`section ${styles.hero}`}>
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          <div className={styles.badge}>
            <span className={styles.pulse}></span>
            Admissions Open for 2026 Batches
          </div>
          
          <h1 className={styles.title}>
            Learn. Build.<br />
            <span className={styles.highlight}>Showcase. Grow.</span>
          </h1>
          
          <p className={styles.subtitle}>
            Turn your academic knowledge into practical, career-ready skills through structured learning, hands-on projects, and guided internship experiences.
          </p>

          <div className={styles.buttonGroup}>
            <Link href="/internships" className={styles.primaryButton}>
              Explore Internships
            </Link>
            {/* Client component — opens Apply modal with course dropdown */}
            <HeroApplyButton />
            <Link href="/verify" className={styles.secondaryButton}>
              Certificate Verification
            </Link>
          </div>

          <div className={styles.trustSignals}>
            <div className={styles.signal}>
              <CheckCircle size={18} className={styles.signalIcon} />
              <span>Project-Based Learning</span>
            </div>
            <div className={styles.signal}>
              <CheckCircle size={18} className={styles.signalIcon} />
              <span>Industry Mentors</span>
            </div>
            <div className={styles.signal}>
              <CheckCircle size={18} className={styles.signalIcon} />
              <span>Real-World Scenarios</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

