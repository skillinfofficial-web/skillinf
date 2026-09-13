'use client';

import Link from 'next/link';
import styles from './PopularDomainsSection.module.css';

const domains = [
  {
    name: 'Web Development',
    icon: '</>',
    bg: '#E8F8F2',
    color: '#1A7F5A',
  },
  {
    name: 'Data Science',
    icon: '📊',
    bg: '#F0ECFF',
    color: '#6B3FA0',
  },
  {
    name: 'Artificial Intelligence',
    icon: '🧠',
    bg: '#E8F1FF',
    color: '#2557C7',
  },
  {
    name: 'Python Development',
    icon: '🐍',
    bg: '#FFF4E8',
    color: '#B85C00',
  },
  {
    name: 'UI/UX Design',
    icon: '✏️',
    bg: '#FFF0F3',
    color: '#C0334D',
  },
  {
    name: 'Data Analytics',
    icon: '📈',
    bg: '#E8FFF4',
    color: '#1A7F5A',
  },
  {
    name: 'Cloud Computing',
    icon: '☁️',
    bg: '#E8F4FF',
    color: '#0A6BB5',
  },
  {
    name: 'Cybersecurity',
    icon: '🔒',
    bg: '#FFF8E8',
    color: '#A06B00',
  },
  {
    name: 'And More...',
    icon: '···',
    bg: '#F2F4F6',
    color: '#5C6F78',
  },
];

export default function PopularDomainsSection() {
  return (
    <section className={styles.section}>
      <div className={`container ${styles.inner}`}>

        {/* Header row */}
        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>EXPLORE</p>
            <h2 className={styles.heading}>Popular Domains</h2>
          </div>
          <Link href="/sign-in" className={styles.viewAll} id="domains-view-all-btn">
            View All Domains →
          </Link>
        </div>

        {/* Domain grid */}
        <div className={styles.grid}>
          {domains.map((d) => (
            <Link
              key={d.name}
              href="/sign-in"
              className={styles.domainCard}
              aria-label={`Explore ${d.name}`}
            >
              <span
                className={styles.iconCircle}
                style={{ background: d.bg, color: d.color }}
              >
                {d.icon}
              </span>
              <span className={styles.domainName}>{d.name}</span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
