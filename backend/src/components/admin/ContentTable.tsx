'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, ExternalLink, Plus, RefreshCw } from 'lucide-react';
import styles from './ContentTable.module.css';
import DeleteModal from './DeleteModal';

type ContentType = 'internship' | 'program' | 'project';

interface ContentItem {
  _id: string;
  name: string;
  images?: string[];
  trending?: boolean;
  createdAt?: string;
  duration?: number;
  time?: number;
  teachingSection?: string;
  mentorship?: string;
  pricing?: { type: string; finalPrice?: number | null };
  link?: string;
  skills?: string[];
  projects?: string[];
}

interface ContentTableProps {
  type: ContentType;
  title: string;
}

export default function ContentTable({ type, title }: ContentTableProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/content?type=${type}`);
      const data = await res.json();
      if (data.success) setItems(data.items);
      else setError(data.message || 'Failed to load.');
    } catch {
      setError('Network error. Could not load data.');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/content/${deleteTarget._id}?type=${type}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else {
        alert(data.message || 'Delete failed.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{items.length} {type}{items.length !== 1 ? 's' : ''} in database</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={fetchItems} disabled={loading} title="Refresh">
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
          <Link href="/admin/add" className={styles.addBtn}>
            <Plus size={16} /> Add {title.replace(/s$/, '')}
          </Link>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className={styles.state}>
          <div className={styles.spinner} />
          <p>Loading {title.toLowerCase()}…</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={fetchItems}>Try Again</button>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && items.length === 0 && (
        <div className={styles.state}>
          <p className={styles.emptyText}>No {title.toLowerCase()} yet.</p>
          <Link href="/admin/add" className={styles.addBtn}>
            <Plus size={16} /> Add First {title.replace(/s$/, '')}
          </Link>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && !error && items.length > 0 && (
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item._id} className={styles.card}>
              {/* Thumbnail */}
              <div className={styles.thumbnail}>
                {item.images && item.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.images[0]} alt={item.name} className={styles.thumbImg} />
                ) : (
                  <div className={styles.thumbPlaceholder}>No Image</div>
                )}
                <span className={styles.typeBadge}>{type}</span>
                {item.trending && <span className={styles.trendingBadge}>🔥 Trending</span>}
              </div>

              {/* Body */}
              <div className={styles.cardBody}>
                <h3 className={styles.itemName}>{item.name}</h3>

                <div className={styles.metaRow}>
                  {/* Internship / Program details */}
                  {(type === 'internship' || type === 'program') && (
                    <>
                      {item.duration && <span className={styles.metaChip}>⏱ {item.duration}w</span>}
                      {item.teachingSection && <span className={styles.metaChip}>🕐 {item.teachingSection}</span>}
                      {item.pricing && (
                        <span className={styles.metaChip}>
                          {item.pricing.type === 'free' ? '🆓 Free' : item.pricing.finalPrice != null ? `₹${item.pricing.finalPrice}` : 'Paid'}
                        </span>
                      )}
                    </>
                  )}
                  {/* Project link */}
                  {type === 'project' && item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.linkChip}>
                      <ExternalLink size={12} /> View Project
                    </a>
                  )}
                </div>

                {item.skills && item.skills.length > 0 && (
                  <p className={styles.skillsPreview}>
                    {item.skills.slice(0, 3).join(' · ')}{item.skills.length > 3 ? ` +${item.skills.length - 3}` : ''}
                  </p>
                )}

                {item.createdAt && (
                  <p className={styles.dateText}>
                    Added {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className={styles.cardActions}>
                <Link
                  href={`/admin/edit/${type}/${item._id}`}
                  className={styles.editBtn}
                >
                  <Pencil size={14} /> Edit
                </Link>
                <button
                  className={styles.deleteBtn}
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
