'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import CompanyInternshipForm from '@/components/CompanyInternshipForm';
import styles from '../../../add/add.module.css';

interface WeekData {
  week: number;
  deadlineDays: number;
  tutorialUrl: string;
  keyFeatures: string[];
  whatYouLearn: string;
}

interface InternshipData {
  _id: string;
  name: string;
  weeks: WeekData[];
}

export default function EditCompanyInternshipPage() {
  const params = useParams<{ id: string }>();
  const id     = params?.id;

  const [data,    setData]    = useState<InternshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/company-internships/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.item);
        else setError(d.message || 'Failed to load.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Edit Company Internship</h1>
        <p className={styles.description}>
          Update the internship name, weekly content, tutorials and key features.
        </p>
      </header>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--secondary-text)', padding: '40px 0' }}>
          <Loader2 size={22} style={{ animation: 'spin 0.8s linear infinite' }} />
          <span>Loading internship data…</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--error)', background: '#fdf2f2', border: '1px solid #f5c6cb', borderRadius: 10, padding: '14px 18px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {!loading && !error && data && (
        <CompanyInternshipForm editMode editId={id} initialName={data.name} initialWeeks={data.weeks} />
      )}
    </div>
  );
}
