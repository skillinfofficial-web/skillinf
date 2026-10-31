'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styles from './VerifyModal.module.css';

interface Props {
  certId: string;
  eventName: string;
  onClose: () => void;
  prefillEmail?: string;
  autoVerify?: boolean;
}

export default function VerifyModal({ certId, eventName, onClose, prefillEmail, autoVerify }: Props) {
  const [email,   setEmail]   = useState(prefillEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [result,  setResult]  = useState<{
    found: boolean; tier?: string; message: string;
  } | null>(null);

  const verify = useCallback(async (targetEmail?: string) => {
    const eToVerify = (targetEmail ?? email).trim();
    if (!eToVerify) { setErr('Please enter your email address.'); return; }
    setErr('');
    setLoading(true);
    try {
      const res  = await fetch('/api/event-certificates/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId, email: eToVerify }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ found: data.found, tier: data.tier, message: data.message });
      } else {
        setErr(data.message ?? 'Verification failed.');
      }
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [certId, email]);

  useEffect(() => {
    if (autoVerify && prefillEmail) {
      verify(prefillEmail);
    }
  }, [autoVerify, prefillEmail, verify]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">&#x2715;</button>
        <h2 className={styles.title}>Verify Certificate</h2>
        <p className={styles.sub}>{eventName}</p>

        {!result ? (
          <>
            <label className={styles.label}>Your registered email address</label>
            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') verify(); }}
              autoFocus={!prefillEmail}
            />
            {err && <p className={styles.err}>{err}</p>}
            <button className={styles.btn} onClick={() => verify()} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </>
        ) : (
          <div className={result.found ? styles.successBox : styles.notFoundBox}>
            {result.found && result.tier && (
              <div className={styles.tier}>{result.tier}</div>
            )}
            <p className={styles.message}>{result.message}</p>
            <button className={styles.resetBtn} onClick={() => setResult(null)}>
              Try another email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

