'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './SignIn.module.css';

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [noAcct,  setNoAcct]  = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNoAcct(false);
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        if (res.status === 401 && data.message?.includes('No account')) setNoAcct(true);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Brand bar */}
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

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.sub}>Sign in to continue your internship journey</p>
          </div>

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
          </form>

          <p className={styles.footer}>
            Don&apos;t have an account yet?{' '}
            <Link href="/sign-up" className={styles.link}>Create one</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
