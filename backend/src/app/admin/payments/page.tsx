'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import styles from './Payments.module.css';

export default function PaymentsPage() {
  const [eCertPrice, setECertPrice] = useState<number | ''>('');
  const [physicalCertPrice, setPhysicalCertPrice] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    fetch('/api/payment-config')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.config) {
          setECertPrice(d.config.eCertPrice ?? 149);
          setPhysicalCertPrice(d.config.physicalCertPrice ?? 149);
        } else {
          setError(d.message || 'Failed to load config.');
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (eCertPrice === '' || physicalCertPrice === '') {
      setError('Both prices are required.'); return;
    }
    if (Number(eCertPrice) < 1 || Number(physicalCertPrice) < 1) {
      setError('Prices must be at least ₹1.'); return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/payment-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eCertPrice: Number(eCertPrice),
          physicalCertPrice: Number(physicalCertPrice),
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
            Configure the pricing for e-certificate and physical certificate payments.
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
          <p>Loading configuration…</p>
        </div>
      )}

      {!loading && (
        <div className={styles.formCard}>
          <div className={styles.formGrid}>
            {/* E-Certificate Price */}
            <div className={styles.priceBlock}>
              <div className={styles.priceBlockHeader}>
                <div className={styles.priceIcon}>🎓</div>
                <div>
                  <p className={styles.priceLabel}>E-Certificate Price</p>
                  <p className={styles.priceHint}>Paid by user to unlock & download the digital certificate</p>
                </div>
              </div>
              <div className={styles.inputWrap}>
                <span className={styles.rupeeSign}>₹</span>
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
            </div>

            {/* Physical Certificate Price */}
            <div className={styles.priceBlock}>
              <div className={styles.priceBlockHeader}>
                <div className={styles.priceIcon}>📦</div>
                <div>
                  <p className={styles.priceLabel}>Physical Certificate Price</p>
                  <p className={styles.priceHint}>Paid by user for physical certificate delivery to their address</p>
                </div>
              </div>
              <div className={styles.inputWrap}>
                <span className={styles.rupeeSign}>₹</span>
                <input
                  id="physicalCertPrice"
                  className={styles.priceInput}
                  type="number"
                  min={1}
                  max={9999}
                  placeholder="149"
                  value={physicalCertPrice}
                  onChange={e => {
                    setPhysicalCertPrice(e.target.value === '' ? '' : Number(e.target.value));
                    setError(''); setSuccess('');
                  }}
                />
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
              💡 Prices update instantly — no restart required.
            </p>
            <button
              className={styles.saveBtn}
              disabled={saving}
              onClick={handleSave}
            >
              {saving
                ? <><Loader2 size={16} className={styles.btnSpinner} /> Saving…</>
                : <><Save size={16} /> Save Prices</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
