'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './SignIn.module.css';

interface DomainOption { id: string; domain: string; }

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [noAcct,  setNoAcct]  = useState(false);
  const [loading, setLoading] = useState(false);

  // Certificate price — fetched from admin config so it stays in sync
  const [certPrice, setCertPrice] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/admin/payment-config')
      .then(r => r.json())
      .then(d => { if (d.eCertPrice) setCertPrice(d.eCertPrice); })
      .catch(() => {});
  }, []);

  // Multi-domain state
  const [domainOptions, setDomainOptions]   = useState<DomainOption[]>([]);
  const [selectingDomain, setSelectingDomain] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState('');

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNoAcct(false);
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      // Multiple domains — show picker
      if (data.requireDomainSelect) {
        setDomainOptions(data.domains);
        setSelectingDomain(true);
        setLoading(false);
        return;
      }

      if (!data.success) {
        setError(data.message);
        if (res.status === 401 && data.message?.includes('No account')) setNoAcct(true);
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const submitDomainPick = async () => {
    if (!selectedDomainId) { setError('Please select a domain.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, domainId: selectedDomainId }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Brand bar */}
      <div className={styles.brand}>
        <Link href="/" className={styles.logoWrap} aria-label="skillinf Home">
          <Image
            src="/skillinf-logo.png"
            alt="skillinf — Learn Built Grow"
            width={160}
            height={60}
            priority
            className={styles.logoImg}
          />
        </Link>
      </div>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.title}>
              {selectingDomain ? 'Choose Your Domain' : 'Welcome back'}
            </h1>
            <h2 className={styles.sub}>
              {selectingDomain
                ? 'You have multiple internship enrollments. Select which domain to continue with.'
                : 'Sign in to continue your internship journey'}
            </h2>
          </div>

          {/* ── Domain picker step ── */}
          {selectingDomain ? (
            <div className={styles.domainPicker}>
              {error && <div className={styles.errorBox}>{error}</div>}
              <div className={styles.domainList}>
                {domainOptions.map(opt => (
                  <button
                    key={opt.id}
                    className={`${styles.domainOption} ${selectedDomainId === opt.id ? styles.domainOptionActive : ''}`}
                    onClick={() => setSelectedDomainId(opt.id)}
                    type="button"
                  >
                    <span className={styles.domainRadio}>
                      {selectedDomainId === opt.id ? '●' : '○'}
                    </span>
                    <span className={styles.domainName}>{opt.domain}</span>
                    {selectedDomainId === opt.id && (
                      <span className={styles.domainCheck}>✓</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                className={styles.submitBtn}
                disabled={!selectedDomainId || loading}
                onClick={submitDomainPick}
                type="button"
              >
                {loading ? 'Signing in…' : 'Continue to Dashboard →'}
              </button>
              <button
                className={styles.backBtn}
                onClick={() => { setSelectingDomain(false); setSelectedDomainId(''); setError(''); }}
                type="button"
              >
                ← Back
              </button>
            </div>
          ) : (
            /* ── Regular login form ── */
            <form onSubmit={submit} className={styles.form} noValidate>
              {error && (
                <div className={styles.errorBox}>
                  {error}
                  {noAcct && (
                    <span> <Link href="/sign-up" className={styles.errLink}>Create an account</Link></span>
                  )}
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="si-email">Email ID</label>
                <input id="si-email" className={styles.input} type="email" placeholder="arun@example.com"
                  value={form.email} onChange={update('email')} required autoComplete="email" />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="si-password">
                  Password <span className={styles.hint}>(your registered mobile number)</span>
                </label>
                <input id="si-password" className={styles.input} type="password" placeholder="••••••••••"
                  value={form.password} onChange={update('password')} required autoComplete="current-password" />
              </div>

              <button id="si-submit" className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {/* ── Free course + certificate price note ── */}
              <p className={styles.freeNote}>
                🎓 Your course is <strong>completely free</strong>. If you need a{' '}
                <strong>Certificate of Completion</strong>, you need to pay{' '}
                <strong>
                  {certPrice !== null ? `₹${certPrice}` : '…'}
                </strong>.
              </p>
            </form>
          )}

          <p className={styles.footer}>
            Don&apos;t have an account yet?{' '}
            <Link href="/sign-up" className={styles.link}>Create one</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
