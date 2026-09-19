'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './VerifyCertificateSection.module.css';

interface CertData {
  certificateId: string;
  name: string;
  domain: string;
  startDate: string;
  endDate: string;
  completedSteps: number;
  certificateUnlocked: boolean;
  issuedAt: string | null;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return d; }
}
function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

/* Props: embedded = true → show form directly (for /verify-certificate page)
          embedded = false/undefined → show trigger button (for homepage)
          prefillId → auto-fill certificate ID (from QR code scan) */
export default function VerifyCertificateSection({ embedded, prefillId }: { embedded?: boolean; prefillId?: string }) {
  const [certId,  setCertId]  = useState(prefillId || '');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<CertData | null>(null);
  const [error,   setError]   = useState('');

  // verifyById must be defined BEFORE useEffect that calls it
  const verifyById = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const res  = await fetch(`/api/verify-certificate?id=${encodeURIComponent(id.trim())}`);
      const data = await res.json();
      if (data.success) setResult(data.data);
      else              setError(data.message);
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  }, []);

  // Auto-fill + auto-verify when navigated from QR code (?id=...)
  useEffect(() => {
    if (prefillId && prefillId.trim()) {
      setCertId(prefillId.trim());
      const t = setTimeout(() => verifyById(prefillId.trim()), 400);
      return () => clearTimeout(t);
    }
  }, [prefillId, verifyById]);

  const verify = () => verifyById(certId);

  const reset = () => { setCertId(''); setResult(null); setError(''); };

  /* ── Homepage trigger (not embedded) ── */
  if (!embedded) {
    return (
      <section className={styles.section} id="verify-certificate">
        <div className={styles.inner}>
          <div className={styles.triggerRow}>
            <div className={styles.triggerLeft}>
              <div className={styles.shieldIcon}>🛡️</div>
              <div>
                <h2 className={styles.triggerTitle}>Verify a skillinf Certificate</h2>
                <p className={styles.triggerSub}>Instantly confirm the authenticity of any skillinf internship certificate</p>
              </div>
            </div>
            <Link href="/verify-certificate" className={styles.triggerBtn} id="verify-cert-open-btn">
              Verify Certificate →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ── Embedded (full page form) ── */
  return (
    <div className={styles.embeddedWrap}>
      {!result ? (
        <>
          <p className={styles.panelInfo}>
            Enter the <strong>Certificate ID</strong> found at the bottom of the skillinf certificate document.
          </p>
          <div className={styles.inputRow}>
            <input id="cert-id-input" className={styles.input} type="text"
              placeholder="e.g. 66f1a2b3c4d5e6f7a8b9c0d1"
              value={certId}
              onChange={e => { setCertId(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && verify()} />
            <button id="cert-verify-btn" className={styles.verifyBtn}
              onClick={verify} disabled={loading || !certId.trim()}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </div>
          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>✕</span>
              <div>
                <p className={styles.errorTitle}>Not Verified</p>
                <p className={styles.errorMsg}>{error}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.resultCard}>
          <div className={styles.verifiedBanner}>
            <div className={styles.verifiedCheck}>✓</div>
            <div>
              <p className={styles.verifiedTitle}>Certificate Verified</p>
              <p className={styles.verifiedSub}>This certificate was issued by skillinf and is authentic.</p>
            </div>
            <div className={styles.skillinf}>skillinf</div>
          </div>
          <div className={styles.detailsGrid}>
            {[
              ['Certificate Holder', result.name],
              ['Internship Domain', result.domain],
              ['Start Date', fmtDate(result.startDate)],
              ['End Date', fmtDate(result.endDate)],
              ['Duration', `${daysBetween(result.startDate, result.endDate)} days`],
              ['Steps Completed', `${result.completedSteps} / 4`],
              ['Certificate Status', result.certificateUnlocked ? '✓ Fully Completed' : '⏳ In Progress'],
              ['Certificate ID', result.certificateId],
            ].map(([label, value]) => (
              <div key={label} className={styles.detailItem}>
                <span className={styles.detailLabel}>{label}</span>
                <span className={`${styles.detailValue}
                  ${label === 'Certificate Status' && result.certificateUnlocked ? styles.statusActive : ''}
                  ${label === 'Certificate Status' && !result.certificateUnlocked ? styles.statusPending : ''}
                  ${label === 'Certificate ID' ? styles.certIdText : ''}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.resultFooter}>
            <p className={styles.footerNote}>✓ Verified by skillinf · <span>skillinf.com</span></p>
            <button className={styles.verifyAnotherBtn} onClick={reset}>Verify Another →</button>
          </div>
        </div>
      )}
    </div>
  );
}
