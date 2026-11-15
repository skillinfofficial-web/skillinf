'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import styles from './VerifyPage.module.css';
import VerifyCertificateSection from '@/components/home/VerifyCertificateSection';
import Link from 'next/link';

/* Inner component reads search params and passes prefill id */
function VerifyContent() {
  const searchParams = useSearchParams();
  const prefillId = searchParams.get('id') || '';
  return <VerifyCertificateSection embedded prefillId={prefillId} />;
}

export default function VerifyCertificatePage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroBadge}>🛡️ Certificate Verification</div>
            <h1 className={styles.heroTitle}>Verify a Skillinf Certificate</h1>
            <p className={styles.heroSub}>
              Instantly confirm the authenticity of any Skillinf internship certificate
              using the unique Certificate ID printed on the document.
            </p>
          </div>
        </section>

        {/* Verification form with optional prefill from QR code */}
        <section className={styles.formSection}>
          <div className="container">
            <Suspense fallback={<div>Loading…</div>}>
              <VerifyContent />
            </Suspense>
          </div>
        </section>

        {/* How it works */}
        <section className={styles.howSection}>
          <div className="container">
            <h2 className={styles.howTitle}>How to verify</h2>
            <div className={styles.howGrid}>
              {[
                { step: '1', text: 'Find the Certificate ID at the bottom of the Skillinf certificate document.' },
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
            <p className={styles.ctaText}>Want to earn your own Skillinf certificate?</p>
            <Link href="/sign-up" className={styles.ctaBtn}>Start Your Internship →</Link>
          </div>
        </section>

        {/* SEO: why verify and about Skillinf certificates */}
        <section style={{ padding: '40px 0', background: 'var(--background)' }}>
          <div className="container">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px', color: 'var(--main-text)' }}>
              Why Verify a Skillinf Certificate?
            </h2>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '12px' }}>
              Employers, recruiters, and academic institutions can use this page to instantly verify the authenticity of any Skillinf internship certificate. Each certificate carries a unique Certificate ID that is linked to our database — entering the ID on this page will confirm the holder&apos;s name, the domain they completed, the program duration, the start and end dates, and their completion status.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '24px' }}>
              Verification takes seconds and requires no login. Simply enter the Certificate ID from the certificate document and click &ldquo;Verify&rdquo;. The result will display all relevant details associated with that certificate immediately.
            </p>
            <h3 style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--main-text)' }}>About Skillinf Internship Certificates</h3>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '12px' }}>
              Skillinf issues digitally verifiable internship certificates to students who successfully complete a 30-day virtual internship program. Certificates are issued across domains including Artificial Intelligence and Machine Learning, Data Science, Web Development, Full Stack Development, Python Development, Cloud Computing, Cybersecurity, UI/UX Design, and Automation.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '12px' }}>
              To earn a Skillinf certificate, students must enroll in a program, complete their assigned project tasks within the 30-day internship period, and get their LinkedIn verification post approved. Upon successful completion, the certificate becomes available for download from the student&apos;s dashboard. Each certificate includes the student&apos;s full name, the internship domain, the program dates, and a unique Certificate ID for verification.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75 }}>
              Skillinf certificates are accepted by students for placement applications, LinkedIn profiles, college portfolios, and resume building. If you are an employer or institution and would like to verify a certificate or learn more about Skillinf&apos;s internship programs, please contact our support team via the support page.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
