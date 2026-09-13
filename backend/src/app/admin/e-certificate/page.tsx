'use client';

import React, { useEffect, useState } from 'react';
import { Award, Loader2, AlertCircle, Users } from 'lucide-react';
import styles from './ECertificate.module.css';

interface ECertUser {
  id: string;
  name: string;
  email: string;
  domain: string;
  eCertPaid: boolean;
  createdAt: string | null;
}

export default function ECertificatePage() {
  const [records, setRecords] = useState<ECertUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    fetch('/api/e-certificate')
      .then(r => r.json())
      .then(d => { if (d.success) setRecords(d.users); else setError(d.message || 'Failed.'); })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>E-Certificate</h1>
          <p className={styles.description}>
            Interns who have completed their e-certificate payment and unlocked their digital certificate.
          </p>
        </div>
        <div className={styles.countPill}>
          <Award size={14} />
          {loading ? '…' : records.length} Issued
        </div>
      </header>

      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spinner} />
          <p>Loading records…</p>
        </div>
      )}
      {error && !loading && (
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          <AlertCircle size={22} />
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && records.length === 0 && (
        <div className={styles.stateBox}>
          <Users size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No e-certificates issued yet</p>
          <p className={styles.emptyHint}>Once interns pay and unlock their certificate, they'll appear here.</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Domain</th>
                <th>E-Certificate</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((u, i) => (
                <tr key={u.id} className={styles.row}>
                  <td className={styles.srNo}>{i + 1}</td>
                  <td className={styles.studentCell}>
                    <p className={styles.studentName}>{u.name}</p>
                    <p className={styles.studentEmail}>{u.email}</p>
                  </td>
                  <td>
                    <span className={styles.domainBadge}>{u.domain}</span>
                  </td>
                  <td>
                    <span className={styles.certBadge}>
                      <svg viewBox="0 0 12 10" fill="none" className={styles.certTick}>
                        <path d="M1 5l3 4 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      E-Certificate Done
                    </span>
                  </td>
                  <td className={styles.dateCell}>{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
