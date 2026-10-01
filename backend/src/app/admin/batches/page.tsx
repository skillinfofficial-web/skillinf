'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, Plus, Trash2, X, AlertCircle,
  CheckCircle, Loader2, Link2, Users,
} from 'lucide-react';
import styles from './batches.module.css';

interface Batch {
  _id: string;
  batchName: string;
  startDate: string;
  endDate: string;
  whatsappLink: string;
  status: string;
  createdAt: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function BatchesPage() {
  /* ── List ────────────────────────────────────────────────── */
  const [batches, setBatches] = useState<Batch[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  /* ── Form ────────────────────────────────────────────────── */
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── Delete ──────────────────────────────────────────────── */
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* ── Load ────────────────────────────────────────────────── */
  const load = useCallback(() => {
    setListLoading(true); setListError('');
    fetch('/api/batches')
      .then((r) => r.json())
      .then((d) => { if (d.success) setBatches(d.batches); else setListError(d.message || 'Failed.'); })
      .catch(() => setListError('Network error.'))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Reset ───────────────────────────────────────────────── */
  const resetForm = () => {
    setBatchName(''); setStartDate(''); setEndDate(''); setWhatsappLink('');
    setFormError(''); setFormSuccess('');
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!batchName.trim()) { setFormError('Batch name is required.'); return; }
    if (!startDate) { setFormError('Start date is required.'); return; }
    if (!endDate) { setFormError('End date is required.'); return; }
    if (new Date(endDate) < new Date(startDate)) { setFormError('End date must be after start date.'); return; }
    if (!whatsappLink.trim()) { setFormError('WhatsApp group link is required.'); return; }
    try { new URL(whatsappLink); } catch { setFormError('Enter a valid WhatsApp URL (include https://).'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchName: batchName.trim(), startDate, endDate, whatsappLink: whatsappLink.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess('Batch created successfully!');
        resetForm();
        load();
        setTimeout(() => setFormSuccess(''), 3000);
      } else {
        setFormError(data.message || 'Failed to create batch.');
      }
    } catch { setFormError('Network error.'); }
    finally { setSubmitting(false); }
  };

  /* ── Delete ──────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      const res = await fetch('/api/batches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget._id }),
      });
      const data = await res.json();
      if (data.success) {
        setBatches((b) => b.filter((x) => x._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else setDeleteError(data.message || 'Failed to delete.');
    } catch { setDeleteError('Network error.'); }
    finally { setDeleting(false); }
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Batches</h1>
          <p className={styles.desc}>
            Create and manage internship batches — each batch gets a WhatsApp group link shared with enrolled students.
          </p>
        </div>
        <div className={styles.countBadge}>
          <Users size={14} />
          {listLoading ? '…' : `${batches.length} batch${batches.length !== 1 ? 'es' : ''}`}
        </div>
      </header>

      {/* ── Create Batch Form ── */}
      <div className={styles.addCard}>
        <p className={styles.addCardTitle}>
          <CalendarDays size={16} className={styles.addCardIcon} />
          Create New Batch
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* Batch Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="batch-name">
              Batch Name <span className={styles.required}>*</span>
            </label>
            <input
              id="batch-name"
              type="text"
              className={styles.input}
              value={batchName}
              onChange={(e) => { setBatchName(e.target.value); setFormError(''); }}
              placeholder="e.g. Batch 2025 — July"
            />
          </div>

          {/* Date row */}
          <div className={styles.dateRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="batch-start">
                Start Date <span className={styles.required}>*</span>
              </label>
              <input
                id="batch-start"
                type="date"
                className={styles.input}
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setFormError(''); }}
              />
            </div>
            <div className={styles.dateSep}>→</div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="batch-end">
                End Date <span className={styles.required}>*</span>
              </label>
              <input
                id="batch-end"
                type="date"
                className={styles.input}
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => { setEndDate(e.target.value); setFormError(''); }}
              />
            </div>
          </div>

          {/* WhatsApp Group Link */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="batch-wa">
              <Link2 size={12} /> WhatsApp Group Link <span className={styles.required}>*</span>
            </label>
            <input
              id="batch-wa"
              type="url"
              className={styles.input}
              value={whatsappLink}
              onChange={(e) => { setWhatsappLink(e.target.value); setFormError(''); }}
              placeholder="https://chat.whatsapp.com/..."
            />
            <p className={styles.hint}>Students will be redirected to this link after enrolment.</p>
          </div>

          {formError && (
            <p className={styles.formError}><AlertCircle size={14} />{formError}</p>
          )}
          {formSuccess && (
            <p className={styles.formSuccess}><CheckCircle size={14} />{formSuccess}</p>
          )}

          <div className={styles.formActions}>
            <button type="button" className={styles.resetBtn} onClick={resetForm} disabled={submitting}>
              Reset
            </button>
            <button type="submit" id="create-batch-btn" className={styles.submitBtn} disabled={submitting}>
              {submitting
                ? <><Loader2 size={14} className={styles.spin} /> Creating…</>
                : <><Plus size={14} /> Create Batch</>}
            </button>
          </div>
        </form>
      </div>

      {/* ── Batches List ── */}
      {listLoading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spin} /><span>Loading batches…</span>
        </div>
      )}
      {listError && !listLoading && (
        <div className={`${styles.stateBox} ${styles.stateError}`}>
          <AlertCircle size={20} /><span>{listError}</span>
        </div>
      )}
      {!listLoading && !listError && batches.length === 0 && (
        <div className={styles.stateBox}>
          <CalendarDays size={36} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No batches yet</p>
          <p className={styles.emptyHint}>Fill in the form above and click &ldquo;Create Batch&rdquo; to get started.</p>
        </div>
      )}

      {!listLoading && !listError && batches.length > 0 && (
        <div className={styles.list}>
          {batches.map((b, i) => (
            <div key={b._id} className={styles.row}>

              {/* Icon */}
              <div className={styles.rowIcon}>
                <CalendarDays size={18} />
              </div>

              {/* Info */}
              <div className={styles.rowInfo}>
                <p className={styles.rowName}>{b.batchName}</p>
                <span className={styles.rowDates}>
                  {fmtDate(b.startDate)} — {fmtDate(b.endDate)}
                </span>
              </div>

              {/* WhatsApp link */}
              <a
                href={b.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waLink}
                title="Open WhatsApp Group"
              >
                {/* WhatsApp icon SVG */}
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.waIcon}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Group
              </a>

              {/* Date + Delete */}
              <div className={styles.rowActions}>
                <span className={styles.rowCreated}>
                  Added {fmtDate(b.createdAt)}
                </span>
                <button
                  className={styles.deleteBtn}
                  id={`delete-batch-${i}`}
                  title="Delete batch"
                  onClick={() => { setDeleteTarget(b); setDeleteError(''); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={`${styles.modalIcon} ${styles.modalIconDanger}`}><Trash2 size={18} /></div>
              <div>
                <h2 className={styles.modalTitle}>Delete Batch?</h2>
                <p className={styles.modalSub}>
                  &ldquo;<strong>{deleteTarget.batchName}</strong>&rdquo; will be permanently removed. This cannot be undone.
                </p>
              </div>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            {deleteError && <p className={styles.formError}><AlertCircle size={14} />{deleteError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.resetBtn} onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={handleDelete}
                disabled={deleting}
                id="confirm-delete-batch-btn"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
