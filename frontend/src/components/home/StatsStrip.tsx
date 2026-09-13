import styles from './StatsStrip.module.css';

export default function StatsStrip() {
  return (
    <div className={styles.strip}>
      <div className={`container ${styles.inner}`}>

        {/* Live indicator */}
        <div className={styles.liveGroup}>
          <span className={styles.liveDot} aria-hidden="true" />
          <span className={styles.liveLabel}>PLATFORM LIVE</span>
        </div>

        <div className={styles.divider} />

        {/* Stat 1 */}
        <div className={styles.stat}>
          <span className={styles.statNum}>1,040<span className={styles.plus}>+</span></span>
          <span className={styles.statLabel}>Active Interns</span>
        </div>

        <div className={styles.divider} />

        {/* Stat 2 */}
        <div className={styles.stat}>
          <span className={styles.statNum}>80<span className={styles.plus}>+</span></span>
          <span className={styles.statLabel}>Certificates Issued</span>
        </div>

      </div>
    </div>
  );
}
