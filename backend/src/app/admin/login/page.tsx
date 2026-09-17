'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Mail, Lock, AlertCircle } from 'lucide-react';
import styles from './login.module.css';

const ADMIN_EMAIL    = 'skillinfofficial@gmail.com';
const ADMIN_PASSWORD = 'skillinf@20042006';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate a small async delay for UX
    await new Promise((r) => setTimeout(r, 400));

    if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Set cookie (expires in 8 hours)
      const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString();
      document.cookie = `admin_session=1; path=/; expires=${expires}; SameSite=Strict`;
      router.push('/admin');
    } else {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <Leaf size={24} />
          </div>
          <div>
            <p className={styles.logoName}>SKILLINF</p>
            <p className={styles.logoSub}>Admin Portal</p>
          </div>
        </div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to access the admin panel</p>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-email">Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="admin-email"
                type="email"
                className={styles.input}
                placeholder="skillinfofficial@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-password">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="admin-password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            id="admin-login-btn"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <p className={styles.footer}>
          SkillInf Admin Panel &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
