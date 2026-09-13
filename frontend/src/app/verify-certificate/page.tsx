import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import styles from './VerifyPage.module.css';
import VerifyCertificateSection from '@/components/home/VerifyCertificateSection';

export const metadata: Metadata = {
  title: 'Verify Certificate | SkillInf',
  description: 'Verify the authenticity of any SkillInf internship certificate instantly using the Certificate ID.',
};

export default function VerifyCertificatePage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroBadge}>🛡️ Certificate Verification</div>
            <h1 className={styles.heroTitle}>Verify a SkillInf Certificate</h1>
            <p className={styles.heroSub}>
              Instantly confirm the authenticity of any SkillInf internship certificate
              using the unique Certificate ID printed on the document.
            </p>
          </div>
        </section>

        {/* Verification form (reuses the section component without the trigger) */}
        <section className={styles.formSection}>
          <div className="container">
            <VerifyCertificateSection embedded />
          </div>
        </section>

        {/* How it works */}
        <section className={styles.howSection}>
          <div className="container">
            <h2 className={styles.howTitle}>How to verify</h2>
            <div className={styles.howGrid}>
              {[
                { step: '1', text: 'Find the Certificate ID at the bottom of the SkillInf certificate document.' },
                { step: '2', text: 'Paste the ID in the field above and click Verify.' },
                { step: '3', text: 'View the holder\'s name, domain, dates, and completion status instantly.' },
              ].map(h => (
                <div key={h.step} className={styles.howCard}>
                  <div className={styles.howNum}>{h.step}</div>
                  <p className={styles.howText}>{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <p className={styles.ctaText}>Want to earn your own SkillInf certificate?</p>
            <Link href="/sign-up" className={styles.ctaBtn}>Start Your Internship →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
