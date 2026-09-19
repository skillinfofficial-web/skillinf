'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './SignUp.module.css';

// Fallback domains shown while loading or if API fails
const FALLBACK_DOMAINS = [
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
  const [isChangeDomain, setIsChangeDomain] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', mobileNumber: '', domain: '',
    startDate: '', endDate: '', referralCode: '', collegeUniversity: '',
  });
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [isAdditional, setIsAdditional] = useState(false);

  // Dynamic domains state
  const [domains,        setDomains]        = useState<string[]>(FALLBACK_DOMAINS);
  const [domainsLoading, setDomainsLoading] = useState(true);

  // Read ?addDomain=1 and ?ref= from URL without useSearchParams (avoids Suspense requirement)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('addDomain') === '1') setIsChangeDomain(true);
    const refParam = params.get('ref');
    if (refParam) setForm(prev => ({ ...prev, referralCode: refParam }));
  }, []);

  // Fetch domains dynamically from admin-managed list
  useEffect(() => {
    fetch('/api/domains')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.domains && d.domains.length > 0) {
          // API returns objects { name } — extract to string[]
          const names = d.domains.map((x: { name: string } | string) =>
            typeof x === 'string' ? x : x.name
          );
          setDomains(names);
        }
        // If API fails or returns empty, keep the FALLBACK_DOMAINS
      })
      .catch(() => {
        // Silently keep fallback domains on network error
      })
      .finally(() => setDomainsLoading(false));
  }, []);

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
      setIsAdditional(!!data.isAdditional);
      setSuccessMsg(data.message || 'Account created successfully!');
      setSuccess(true);
      setTimeout(() => router.push('/sign-in'), 3000);
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
        <Link href="/" className={styles.logoWrap} aria-label="skillinf Home">
          <Image
            src="/skillinf-logo.png"
            alt="skillinf"
            width={140}
            height={50}
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
              {isChangeDomain ? 'Add Another Domain' : 'Create your skillinf account'}
            </h1>
            <h2 className={styles.sub}>
              {isChangeDomain
                ? 'Enroll in a new internship domain using your existing email and mobile number'
                : 'Join thousands of students building real skills'}
            </h2>
          </div>

          {/* ── Multi-domain info banner ── */}
          <div className={styles.multiDomainBanner}>
            <span className={styles.mdbIcon}>🎯</span>
            <div>
              <p className={styles.mdbTitle}>Multiple Domain Internships Supported!</p>
              <p className={styles.mdbText}>
                One person can do multiple domain internships with the same email ID and password.
                Each domain gets a separate dashboard and certificate.
              </p>
            </div>
          </div>

          {success ? (
            <div className={`${styles.successBox} ${isAdditional ? styles.successBoxMulti : ''}`}>
              <span className={styles.successIcon}>{isAdditional ? '🎓' : '✓'}</span>
              <p>{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={submit} className={styles.form} noValidate>
              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="su-name">Full Name</label>
                <input id="su-name" className={styles.input} type="text" placeholder="Arun Kumar"
                  value={form.name} onChange={update('name')} required autoComplete="name" />
                <p className={styles.fieldNote}>📋 This name will be printed on your certificate. Please enter your correct full name.</p>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="su-college">
                  College / University <span className={styles.hint}>(optional)</span>
                </label>
                <input id="su-college" className={styles.input} type="text"
                  placeholder="e.g. Anna University"
                  value={form.collegeUniversity} onChange={update('collegeUniversity')}
                  autoComplete="organization" />
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
                  onChange={update('domain')} required disabled={domainsLoading}>
                  <option value="">
                    {domainsLoading ? 'Loading domains…' : '— Select your domain —'}
                  </option>
                  {domains.map(d => <option key={d} value={d}>{d}</option>)}
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

              <div className={styles.field}>
                <label className={styles.label} htmlFor="su-referral">
                  Referral Code <span className={styles.hint}>(optional)</span>
                </label>
                <input id="su-referral" className={styles.input} type="text"
                  placeholder="e.g. SKLAB1234"
                  value={form.referralCode}
                  onChange={update('referralCode')}
                  maxLength={12}
                  autoComplete="off" />
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
