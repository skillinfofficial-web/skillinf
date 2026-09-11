'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AddContentForm from '@/components/AddContentForm';
import styles from './edit.module.css';

type ContentType = 'internship' | 'program' | 'project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemData = Record<string, any>;

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as ContentType;
  const id = params.id as string;

  const [itemData, setItemData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/content/${id}?type=${type}`);
        const data = await res.json();
        if (data.success) setItemData(data.item);
        else setError(data.message || 'Failed to load item.');
      } catch {
        setError('Network error. Could not load item.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, type]);

  if (loading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p>Loading content…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <button onClick={() => router.back()} className={styles.backBtn}>← Go Back</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>
        <div>
          <h1 className={styles.title}>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</h1>
          <p className={styles.subtitle}>Update the details below and save your changes.</p>
        </div>
      </header>
      {itemData && (
        <AddContentForm defaultValues={itemData} editId={id} contentType={type} />
      )}
    </div>
  );
}
