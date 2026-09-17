'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Building2, Calendar, Loader2, AlertCircle,
  Pencil, Trash2, X, Tag, CheckCircle,
} from 'lucide-react';
import styles from './companyInternships.module.css';

interface CompanyInternship {
  _id: string;
  name: string;
  weeks: { week: number; deadlineDays: number }[];
  createdAt: string;
}

export default function CompanyInternshipsPage() {
  const [items,   setItems]   = useState<CompanyInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Domain modal state
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainName,      setDomainName]      = useState('');
  const [domainLoading,   setDomainLoading]   = useState(false);
  const [domainError,     setDomainError]     = useState('');
  const [domainSuccess,   setDomainSuccess]   = useState('');

  // Delete confirmation state
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    fetch('/api/company-internships')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.items);
        else setError(d.message || 'Failed to load.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Add Domain ─────────────────────────────────────────────────────────── */
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setDomainError(''); setDomainSuccess('');
    if (!domainName.trim()) { setDomainError('Domain name is required.'); return; }
    setDomainLoading(true);
    try {
      const res  = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: domainName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDomainSuccess('Domain added! It now appears in the company internship dropdown and sign-up page.');
        setDomainName('');
        setTimeout(() => { setShowDomainModal(false); setDomainSuccess(''); }, 2200);
      } else {
        setDomainError(data.message || 'Failed to add domain.');
      }
    } catch {
      setDomainError('Network error.');
    } finally {
      setDomainLoading(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true); setDeleteError('');
    try {
      const res  = await fetch(`/api/company-internships/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i._id !== deleteId));
        setDeleteId(null);
      } else {
        setDeleteError(data.message || 'Failed to delete.');
      }
    } catch {
      setDeleteError('Network error.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Company Internships</h1>
            <p className={styles.description}>
              Manage 4-week company internship programmes with weekly learning content.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.domainBtn}
              id="add-domain-btn"
              onClick={() => { setShowDomainModal(true); setDomainError(''); setDomainSuccess(''); setDomainName(''); }}
            >
              <Tag size={15} /> Add Domain
            </button>
            <Link href="/admin/company-internships/new" className={styles.addBtn} id="add-company-internship-btn">
              <Plus size={16} /> Add Company Internship
            </Link>
          </div>
        </div>
      </header>

      {/* ── States ──────────────────────────────────────────────────────────── */}
      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={28} className={styles.spinner} />
          <p>Loading internships…</p>
        </div>
      )}
      {error && !loading && (
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          <AlertCircle size={22} /><p>{error}</p>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className={styles.stateBox}>
          <Building2 size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No company internships yet</p>
          <p className={styles.emptyHint}>Click "Add Company Internship" to create the first one.</p>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      {!loading && !error && items.length > 0 && (
        <div className={styles.grid}>
          {items.map((item) => {
            const totalDays = item.weeks?.reduce((s, w) => s + (w.deadlineDays ?? 0), 0) ?? 0;
            const created   = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';
            return (
              <div key={item._id} className={styles.card}>
                <div className={styles.cardIcon}><Building2 size={20} /></div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{item.name}</h2>
                  <div className={styles.cardMeta}>
                    <span className={styles.metaTag}><Calendar size={13} /> {totalDays} days total</span>
                    <span className={styles.metaTag}>4 weeks</span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.createdAt}>Created {created}</span>
                  <div className={styles.cardActions}>
                    <Link
                      href={`/admin/company-internships/${item._id}/edit`}
                      className={styles.editBtn}
                      title="Edit internship"
                      id={`edit-btn-${item._id}`}
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      className={styles.deleteBtn}
                      title="Delete internship"
                      id={`delete-btn-${item._id}`}
                      onClick={() => { setDeleteId(item._id); setDeleteError(''); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Domain Modal ─────────────────────────────────────────────────── */}
      {showDomainModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDomainModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}><Tag size={18} /></div>
              <div>
                <h2 className={styles.modalTitle}>Add New Domain</h2>
                <p className={styles.modalSub}>This domain will appear in the company internship dropdown and the student sign-up page.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setShowDomainModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {domainSuccess ? (
              <div className={styles.domainSuccess}>
                <CheckCircle size={18} /> {domainSuccess}
              </div>
            ) : (
              <form onSubmit={handleAddDomain} className={styles.domainForm}>
                {domainError && (
                  <div className={styles.domainError}><AlertCircle size={15} /> {domainError}</div>
                )}
                <label className={styles.domainLabel} htmlFor="domain-name-input">Domain Name</label>
                <input
                  id="domain-name-input"
                  type="text"
                  className={styles.domainInput}
                  placeholder="e.g. AI & Machine Learning"
                  value={domainName}
                  onChange={(e) => { setDomainName(e.target.value); setDomainError(''); }}
                  autoFocus
                />
                <button type="submit" className={styles.domainSubmit} disabled={domainLoading}>
                  {domainLoading ? 'Adding…' : 'Add Domain'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      {deleteId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={`${styles.modalIcon} ${styles.modalIconDanger}`}><Trash2 size={18} /></div>
              <div>
                <h2 className={styles.modalTitle}>Delete Internship?</h2>
                <p className={styles.modalSub}>This action cannot be undone. The internship and all its weekly content will be permanently removed.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setDeleteId(null)} aria-label="Close"><X size={18} /></button>
            </div>
            {deleteError && (
              <div className={styles.domainError}><AlertCircle size={15} /> {deleteError}</div>
            )}
            <div className={styles.deleteActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)} disabled={deleteLoading}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleteLoading} id="confirm-delete-btn">
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
