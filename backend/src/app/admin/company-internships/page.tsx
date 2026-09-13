'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, Calendar, Loader2, AlertCircle } from 'lucide-react';
import styles from './companyInternships.module.css';

interface CompanyInternship {
  _id: string;
  name: string;
  weeks: { week: number; deadlineDays: number }[];
  createdAt: string;
}

export default function CompanyInternshipsPage() {
  const [items, setItems] = useState<CompanyInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/company-internships')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.items);
        else setError(d.message || 'Failed to load.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Company Internships</h1>
            <p className={styles.description}>
              Manage 4-week company internship programmes with weekly learning content.
            </p>
          </div>
          <Link href="/admin/company-internships/new" className={styles.addBtn} id="add-company-internship-btn">
            <Plus size={16} /> Add Company Internship
          </Link>
        </div>
      </header>

      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={28} className={styles.spinner} />
          <p>Loading internships…</p>
        </div>
      )}

      {error && !loading && (
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          <AlertCircle size={22} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className={styles.stateBox}>
          <Building2 size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No company internships yet</p>
          <p className={styles.emptyHint}>Click "Add Company Internship" to create the first one.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className={styles.grid}>
          {items.map((item) => {
            const totalDays = item.weeks?.reduce((s, w) => s + (w.deadlineDays ?? 0), 0) ?? 0;
            const created = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
              : '—';
            return (
              <div key={item._id} className={styles.card}>
                <div className={styles.cardIcon}>
                  <Building2 size={20} />
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{item.name}</h2>
                  <div className={styles.cardMeta}>
                    <span className={styles.metaTag}>
                      <Calendar size={13} /> {totalDays} days total
                    </span>
                    <span className={styles.metaTag}>4 weeks</span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.createdAt}>Created {created}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
