'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import styles from './Payments.module.css';

export default function PaymentsPage() {
  const [eCertPrice,         setECertPrice]         = useState<number | ''>('');
  const [eCertDiscount,      setECertDiscount]      = useState<number | ''>('');
  const [physicalCertPrice,  setPhysicalCertPrice]  = useState<number | ''>('');
  const [physicalCertDiscount, setPhysicalCertDiscount] = useState<number | ''>('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    fetch('/api/payment-config')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.config) {
          setECertPrice(d.config.eCertPrice ?? 149);
          setECertDiscount(d.config.eCertDiscount ?? '');
          setPhysicalCertPrice(d.config.physicalCertPrice ?? 149);
          setPhysicalCertDiscount(d.config.physicalCertDiscount ?? '');
        } else {
          setError(d.message || 'Failed to load config.');
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  /* derived preview */
  const eCertFinal = eCertPrice !== '' && eCertDiscount !== '' && Number(eCertDiscount) > 0
    ? Math.max(1, Math.round(Number(eCertPrice) * (1 - Number(eCertDiscount) / 100)))
    : null;
  const physFinal  = physicalCertPrice !== '' && physicalCertDiscount !== '' && Number(physicalCertDiscount) > 0
    ? Math.max(1, Math.round(Number(physicalCertPrice) * (1 - Number(physicalCertDiscount) / 100)))
    : null;

  const handleSave = async () => {
    if (eCertPrice === '' || physicalCertPrice === '') {
      setError('Both prices are required.'); return;
    }
    if (Number(eCertPrice) < 1 || Number(physicalCertPrice) < 1) {
      setError('Prices must be at least Rs. 1.'); return;
    }
    if (eCertDiscount !== '' && (Number(eCertDiscount) < 0 || Number(eCertDiscount) > 100)) {
      setError('E-certificate discount must be 0–100%.'); return;
    }
    if (physicalCertDiscount !== '' && (Number(physicalCertDiscount) < 0 || Number(physicalCertDiscount) > 100)) {
      setError('Physical certificate discount must be 0–100%.'); return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/payment-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eCertPrice:          Number(eCertPrice),
          eCertDiscount:       eCertDiscount === '' ? 0 : Number(eCertDiscount),
          physicalCertPrice:   Number(physicalCertPrice),
          physicalCertDiscount: physicalCertDiscount === '' ? 0 : Number(physicalCertDiscount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Prices updated successfully! Changes will reflect on the user dashboard immediately.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to save.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payment Settings</h1>
          <p className={styles.description}>
            Configure pricing and optional discounts for e-certificate and physical certificate payments.
            Changes take effect immediately on the user dashboard.
          </p>
        </div>
        <div className={styles.headerIcon}>
          <CreditCard size={28} />
        </div>
      </header>

      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spinner} />
          <p>Loading configuration.</p>
        </div>
      )}

      {!loading && (
        <div className={styles.formCard}>
          <div className={styles.formGrid}>

            {/* E-Certificate */}
            <div className={styles.priceBlock}>
              <div className={styles.priceBlockHeader}>
                <div className={styles.priceIconSvg}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <p className={styles.priceLabel}>E-Certificate Price</p>
                  <p className={styles.priceHint}>Paid by user to unlock &amp; download the digital certificate</p>
                </div>
              </div>

              <div className={styles.inputWrap}>
                <span className={styles.rupeeSign}>Rs.</span>
                <input
                  id="eCertPrice"
                  className={styles.priceInput}
                  type="number"
                  min={1}
                  max={9999}
                  placeholder="149"
                  value={eCertPrice}
                  onChange={e => {
                    setECertPrice(e.target.value === '' ? '' : Number(e.target.value));
                    setError(''); setSuccess('');
                  }}
                />
              </div>

              <div className={styles.discountSection}>
                <p className={styles.discountLabel}>Discount (optional)</p>
                <div className={styles.discountWrap}>
                  <input
                    className={styles.discountInput}
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={eCertDiscount}
                    onChange={e => {
                      setECertDiscount(e.target.value === '' ? '' : Number(e.target.value));
                      setError(''); setSuccess('');
                    }}
                  />
                  <span className={styles.discountPct}>%</span>
                </div>
                {eCertFinal !== null && (
                  <p className={styles.discountPreview}>
                    User pays: <span className={styles.discountStrike}>Rs. {eCertPrice}</span>
                    {' '}<strong className={styles.discountFinal}>Rs. {eCertFinal}</strong>
                    <span className={styles.discountTag}>{eCertDiscount}% off</span>
                  </p>
                )}
              </div>
            </div>

            {/* Physical Certificate */}
            <div className={styles.priceBlock}>
              <div className={styles.priceBlockHeader}>
                <div className={styles.priceIconSvg}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                </div>
                <div>
                  <p className={styles.priceLabel}>Physical Certificate Price</p>
                  <p className={styles.priceHint}>Paid by user for physical certificate delivery to their address</p>
                </div>
              </div>

              <div className={styles.inputWrap}>
                <span className={styles.rupeeSign}>Rs.</span>
                <input
                  id="physicalCertPrice"
                  className={styles.priceInput}
                  type="number"
                  min={1}
                  max={9999}
                  placeholder="300"
                  value={physicalCertPrice}
                  onChange={e => {
                    setPhysicalCertPrice(e.target.value === '' ? '' : Number(e.target.value));
                    setError(''); setSuccess('');
                  }}
                />
              </div>

              <div className={styles.discountSection}>
                <p className={styles.discountLabel}>Discount (optional)</p>
                <div className={styles.discountWrap}>
                  <input
                    className={styles.discountInput}
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={physicalCertDiscount}
                    onChange={e => {
                      setPhysicalCertDiscount(e.target.value === '' ? '' : Number(e.target.value));
                      setError(''); setSuccess('');
                    }}
                  />
                  <span className={styles.discountPct}>%</span>
                </div>
                {physFinal !== null && (
                  <p className={styles.discountPreview}>
                    User pays: <span className={styles.discountStrike}>Rs. {physicalCertPrice}</span>
                    {' '}<strong className={styles.discountFinal}>Rs. {physFinal}</strong>
                    <span className={styles.discountTag}>{physicalCertDiscount}% off</span>
                  </p>
                )}
              </div>
            </div>

          </div>

          {error && (
            <div className={styles.alertError}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {success && (
            <div className={styles.alertSuccess}>
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div className={styles.actions}>
            <p className={styles.saveNote}>
              Prices and discounts update instantly — no restart required.
            </p>
            <button
              className={styles.saveBtn}
              disabled={saving}
              onClick={handleSave}
            >
              {saving
                ? <><Loader2 size={16} className={styles.btnSpinner} /> Saving...</>
                : <><Save size={16} /> Save Settings</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
