'use client';

import React, { useEffect, useState } from 'react';
import { Package, Loader2, AlertCircle, MapPin } from 'lucide-react';
import styles from './PhysicalCertificates.module.css';

interface PhysicalCertRecord {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  district: string;
  pincode: string;
  paid: boolean;
  registeredAt: string | null;
}

export default function PhysicalCertificatesPage() {
  const [records, setRecords] = useState<PhysicalCertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    fetch('/api/physical-certificates')
      .then(r => r.json())
      .then(d => {
        if (d.success) setRecords(d.members);
        else setError(d.message || 'Failed to load data.');
      })
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
          <h1 className={styles.title}>Physical Certificate Requests</h1>
          <p className={styles.description}>
            Students who have paid for a physical certificate delivery.
          </p>
        </div>
        <div className={styles.countPill}>
          <Package size={14} />
          {loading ? '…' : records.length} Requests
        </div>
      </header>

      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spinner} />
          <p>Loading requests…</p>
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
          <Package size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No requests yet</p>
          <p className={styles.emptyHint}>Physical certificate payment requests will appear here.</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <>
          {/* Desktop/Tablet — table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Mobile</th>
                  <th>Address</th>
                  <th>District</th>
                  <th>Pincode</th>
                  <th>Requested At</th>
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec.id} className={styles.row}>
                    <td className={styles.studentCell}>
                      <p className={styles.studentName}>{rec.name}</p>
                      <p className={styles.studentEmail}>{rec.email}</p>
                    </td>
                    <td className={styles.mobileCell}>
                      <span className={styles.mobile}>{rec.mobile}</span>
                    </td>
                    <td className={styles.addressCell}>
                      <div className={styles.addressRow}>
                        <MapPin size={12} className={styles.mapIcon} />
                        <span>{rec.address}</span>
                      </div>
                    </td>
                    <td className={styles.districtCell}>{rec.district}</td>
                    <td className={styles.pincodeCell}>
                      <span className={styles.pincodeBadge}>{rec.pincode}</span>
                    </td>
                    <td className={styles.dateCell}>{fmtDate(rec.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — cards */}
          <div className={styles.cardList}>
            {records.map(rec => (
              <div key={rec.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardName}>{rec.name}</p>
                    <p className={styles.cardEmail}>{rec.email}</p>
                  </div>
                  <span className={styles.pincodeBadge}>{rec.pincode}</span>
                </div>
                <div className={styles.cardRows}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLabel}>📱 Mobile</span>
                    <span className={styles.cardRowValue}>{rec.mobile}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLabel}>📍 Address</span>
                    <span className={styles.cardRowValue}>{rec.address}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLabel}>🏙️ District</span>
                    <span className={styles.cardRowValue}>{rec.district}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLabel}>🕐 Date</span>
                    <span className={styles.cardRowValue}>{fmtDate(rec.registeredAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
