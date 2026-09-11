import React from 'react';
import { ShieldCheck, Globe, Layers, Users } from 'lucide-react';
import styles from './BenefitsSection.module.css';

const benefits = [
  { icon: ShieldCheck, title: 'QR-Verified Certificate', desc: 'Receive a verifiable completion credential that employers can scan and trust.' },
  { icon: Globe, title: 'Remote Internship', desc: 'Learn and work from anywhere. No commute, no limits — fully online.' },
  { icon: Layers, title: 'Real-World Projects', desc: 'Build projects you can actually showcase in your portfolio and interviews.' },
  { icon: Users, title: 'Mentorship', desc: 'Get guidance and feedback from experienced mentors while building your work.' },
];

export default function BenefitsSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>What You Get</h2>
      <div className={styles.grid}>
        {benefits.map(({ icon: Icon, title, desc }) => (
          <div key={title} className={styles.card}>
            <div className={styles.iconWrap}><Icon size={22} /></div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDesc}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
