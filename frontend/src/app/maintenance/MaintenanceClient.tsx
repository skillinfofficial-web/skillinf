'use client';

import React, { useEffect, useState } from 'react';
import styles from './maintenance.module.css';

export default function MaintenanceClient({ message }: { message: string }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(iv);
  }, []);

  const lines = message.split('\n').filter(Boolean);
  const supportEmail = lines
    .flatMap(l => l.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [])
    .find(Boolean);

  return (
    <div className={styles.page}>
      {/* Animated background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      <div className={styles.card}>
        {/* Logo / Brand */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#g1)" />
              <path d="M8 22L16 10L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="10" r="2" fill="white" />
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00b894" />
                  <stop offset="1" stopColor="#0a66c2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.logoText}>skillinf</span>
        </div>

        {/* Animated gear/wrench icon */}
        <div className={styles.iconWrap}>
          <div className={styles.iconBg}>
            <svg className={styles.gearIcon} width="56" height="56" viewBox="0 0 56 56" fill="none">
              <path
                d="M28 18a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM28 22a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"
                fill="currentColor"
              />
              <path
                d="M24.5 6l-.8 3.2a14 14 0 0 0-3.8 2.2L16.5 10l-5 8.7 2.5 2.1A14.1 14.1 0 0 0 14 24a14 14 0 0 0 .2 2.2l-2.7 2 5 8.7 3.4-1.4a14 14 0 0 0 3.8 2.2L24.5 41h10l.8-3.3a14 14 0 0 0 3.8-2.2l3.4 1.4 5-8.7-2.7-2A14 14 0 0 0 45 24a14 14 0 0 0-.2-2.2l2.5-2.1-5-8.7-3.4 1.4a14 14 0 0 0-3.8-2.2L34.5 7h-10z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>Under Maintenance</h1>
        <p className={styles.subtitle}>We&rsquo;ll be back soon{dots}</p>

        <div className={styles.divider} />

        <div className={styles.messageBox}>
          {lines.map((line, i) => (
            <p key={i} className={styles.messageLine}>
              {line}
            </p>
          ))}
        </div>

        {supportEmail && (
          <a href={`mailto:${supportEmail}`} className={styles.emailBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
            </svg>
            Contact Support
          </a>
        )}

        <p className={styles.footer}>
          &copy; {new Date().getFullYear()} skillinf &mdash; All rights reserved
        </p>
      </div>
    </div>
  );
}
