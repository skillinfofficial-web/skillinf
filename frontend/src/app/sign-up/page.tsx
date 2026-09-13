'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './SignUp.module.css';

const DOMAINS = [
  'AI & Machine Learning',
  'Data Science',
  'Web Development',
  'Full Stack Development',
  'Python Development',
  'Data Analytics',
  'Cloud Computing',
  'Cybersecurity',
  'UI/UX Design',
  'Automation',
];

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isChangeDomain = searchParams.get('addDomain') === '1';

  const [form, setForm] = useState({
    name: '', email: '', mobileNumber: '', domain: '',
    startDate: '', endDate: '',
  });
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');
  const [isAdditional, setIsAdditional] = useState(false);

  // If coming from "Change Domain", pre-fill a hint
  useEffect(() => {
    if (isChangeDomain) {
      setError('');
    }
  }, [isChangeDomain]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setIsAdditional(data.isAdditional);
      setSuccessMsg(data.message);
      setSuccess(true);
      setTimeout(() => router.push('/sign-in'), 2500);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Brand bar ── */}
      <div className={styles.brand}>
        <Link href="/" className={styles.logoWrap} aria-label="SkillInf Home">
          <Image
            src="/skillinf-logo.png"
            alt="SkillInf — Learn Built Grow"
            width={160}
            height={60}
            priority
            className={styles.logoImg}
          />
        </Link>
      </div>

      {/* ── Card ── */}
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.title}>
              {isChangeDomain ? 'Add Another Domain' : 'Create your SkillInf account'}
            </h1>
            <p className={styles.sub}>
              {isChangeDomain
                ? 'Enroll in a new internship domain using your existing email and mobile number'
                : 'Join thousands of students building real skills'}
            </p>
          </div>

          {/* ── Multi-domain info banner ── */}
          <div className={styles.multiDomainBanner}>
            <span className={styles.mdbIcon}>🎯</span>
            <div>
              <p className={styles.mdbTitle}>Multiple Domain Internships Supported!</p>
              <p className={styles.mdbText}>
                You can enroll in multiple internship domains using the same email ID and mobile number.
                Each domain gives you a separate dashboard and certificate.
              </p>
            </div>
          </div>

          {success ? (
            <div className={`${styles.successBox} ${isAdditional ? styles.successBoxMulti : ''}`}>
              <span className={styles.successIcon}>{isAdditional ? '🎓' : '✓'}</span>
              <p>{successMsg || 'Account created! Redirecting to Sign In…'}</p>
            </div>
          ) : (
            <form onSubmit={submit} className={styles.form} noValidate>
              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="su-name">Full Name</label>
                <input id="su-name" className={styles.input} type="text" placeholder="Arun Kumar"
                  value={form.name} onChange={update('name')} required autoComplete="name" />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="su-email">Email ID</label>
                <input id="su-email" className={styles.input} type="email" placeholder="arun@example.com"
                  value={form.email} onChange={update('email')} required autoComplete="email" />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="su-mobile">
                  Mobile Number <span className={styles.hint}>(used as your sign-in password)</span>
                </label>
                <input id="su-mobile" className={styles.input} type="tel" placeholder="10-digit number"
                  value={form.mobileNumber} onChange={update('mobileNumber')} required
                  maxLength={10} autoComplete="tel" />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="su-domain">Course Domain</label>
                <select id="su-domain" className={styles.select} value={form.domain}
                  onChange={update('domain')} required>
                  <option value="">— Select your domain —</option>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className={styles.dateRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="su-start">Start Date</label>
                  <input id="su-start" className={styles.input} type="date"
                    value={form.startDate} onChange={update('startDate')} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="su-end">End Date</label>
                  <input id="su-end" className={styles.input} type="date"
                    value={form.endDate} onChange={update('endDate')} required />
                </div>
              </div>

              <button id="su-submit" className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Enrolling…' : isChangeDomain ? 'Enroll in New Domain' : 'Create Account'}
              </button>
            </form>
          )}

          <p className={styles.footer}>
            Already have an account?{' '}
            <Link href="/sign-in" className={styles.link}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
