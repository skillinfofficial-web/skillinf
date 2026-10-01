'use client';

import React, { useEffect, useState, useRef, useCallback, DragEvent } from 'react';
import {
  Monitor, Trash2, X, AlertCircle,
  CheckCircle, Loader2, Upload, Plus,
} from 'lucide-react';
import styles from './platforms.module.css';

interface Platform {
  _id: string;
  name: string;
  image: string;
  createdAt: string;
}

export default function PlatformsPage() {
  /* ── List ────────────────────────────────────────────────── */
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  /* ── Form ────────────────────────────────────────────────── */
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Delete ──────────────────────────────────────────────── */
  const [deleteTarget, setDeleteTarget] = useState<Platform | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* ── Load ────────────────────────────────────────────────── */
  const load = useCallback(() => {
    setListLoading(true); setListError('');
    fetch('/api/platforms')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPlatforms(d.platforms); else setListError(d.message || 'Failed.'); })
      .catch(() => setListError('Network error.'))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Image ───────────────────────────────────────────────── */
  const processFile = (file: File) => {
    if (file.type !== 'image/webp') { setFormError('Only .webp images are accepted.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { if (e.target?.result) { setImage(e.target.result as string); setFormError(''); } };
    reader.readAsDataURL(file);
  };
  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0]; if (file) processFile(file);
  };

  const resetForm = () => { setName(''); setImage(null); setFormError(''); setFormSuccess(''); };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!name.trim()) { setFormError('Platform name is required.'); return; }
    if (!image) { setFormError('Please upload a WebP image.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), image }),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess('Platform added successfully!');
        resetForm(); load();
        setTimeout(() => setFormSuccess(''), 3000);
      } else { setFormError(data.message || 'Failed to add platform.'); }
    } catch { setFormError('Network error.'); }
    finally { setSubmitting(false); }
  };

  /* ── Delete ──────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      const res = await fetch('/api/platforms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget._id }),
      });
      const data = await res.json();
      if (data.success) { setPlatforms((p) => p.filter((x) => x._id !== deleteTarget._id)); setDeleteTarget(null); }
      else setDeleteError(data.message || 'Failed to delete.');
    } catch { setDeleteError('Network error.'); }
    finally { setDeleting(false); }
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Platforms</h1>
          <p className={styles.desc}>Add platforms (e.g. Coursera, LinkedIn, GitHub) shown on the public site.</p>
        </div>
        <div className={styles.countBadge}>
          <Monitor size={14} />
          {listLoading ? '…' : `${platforms.length} platform${platforms.length !== 1 ? 's' : ''}`}
        </div>
      </header>

      {/* Add Platform Form */}
      <div className={styles.addCard}>
        <p className={styles.addCardTitle}>
          <Plus size={15} className={styles.addCardIcon} /> Add Platform
        </p>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* 1 — Platform Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="plat-name">
              Name of the Platform <span className={styles.required}>*</span>
            </label>
            <input
              id="plat-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => { setName(e.target.value); setFormError(''); }}
              placeholder="e.g. Coursera, LinkedIn Learning, GitHub"
            />
          </div>

          {/* 2 — Image Upload */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Platform Image <span className={styles.required}>*</span>
              <span className={styles.webpBadge}>WebP only</span>
            </label>

            {/* Size guide */}
            <div className={styles.sizeGuide}>
              <span>📐</span>
              <span>Recommended size: <strong>800 × 450 px (16:9)</strong> — displays perfectly on all device screens.</span>
            </div>

            {!image ? (
              <div
                className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                {/* 16:9 visual placeholder */}
                <div className={styles.imgPlaceholder}>
                  <div className={styles.imgPlaceholderInner}>
                    <Upload size={28} className={styles.uploadIcon} />
                    <p className={styles.dropTitle}>Click or drag &amp; drop</p>
                    <p className={styles.dropHint}>WebP only · 800 × 450 px (16:9)</p>
                  </div>
                  <div className={styles.aspectLabel}>16 : 9</div>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".webp,image/webp"
                  className={styles.hiddenInput}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
                />
              </div>
            ) : (
              <div className={styles.previewWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="preview" className={styles.previewImg} />
                <button type="button" className={styles.removeBtn} onClick={() => setImage(null)}>
                  <X size={13} /> Remove image
                </button>
              </div>
            )}
          </div>

          {formError   && <p className={styles.formError}><AlertCircle size={14} />{formError}</p>}
          {formSuccess && <p className={styles.formSuccess}><CheckCircle size={14} />{formSuccess}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.resetBtn} onClick={resetForm} disabled={submitting}>Reset</button>
            <button type="submit" id="add-platform-btn" className={styles.submitBtn} disabled={submitting}>
              {submitting ? <><Loader2 size={14} className={styles.spin} /> Saving…</> : <><Plus size={14} /> Add Platform</>}
            </button>
          </div>
        </form>
      </div>

      {/* List States */}
      {listLoading && (
        <div className={styles.stateBox}><Loader2 size={26} className={styles.spin} /><span>Loading platforms…</span></div>
      )}
      {listError && !listLoading && (
        <div className={`${styles.stateBox} ${styles.stateError}`}><AlertCircle size={20} /><span>{listError}</span></div>
      )}
      {!listLoading && !listError && platforms.length === 0 && (
        <div className={styles.stateBox}>
          <Monitor size={36} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No platforms yet</p>
          <p className={styles.emptyHint}>Fill the form above and click &ldquo;Add Platform&rdquo;.</p>
        </div>
      )}

      {/* Platforms Grid */}
      {!listLoading && !listError && platforms.length > 0 && (
        <div className={styles.grid}>
          {platforms.map((p, i) => (
            <div key={p._id} className={styles.card}>
              <div className={styles.cardImgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className={styles.cardImg} />
              </div>
              <div className={styles.cardFooter}>
                <p className={styles.cardName}>{p.name}</p>
                <button
                  className={styles.deleteBtn}
                  id={`delete-platform-${i}`}
                  title="Delete platform"
                  onClick={() => { setDeleteTarget(p); setDeleteError(''); }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={`${styles.modalIcon} ${styles.modalIconDanger}`}><Trash2 size={18} /></div>
              <div>
                <h2 className={styles.modalTitle}>Delete Platform?</h2>
                <p className={styles.modalSub}>&ldquo;<strong>{deleteTarget.name}</strong>&rdquo; will be permanently removed.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            {deleteError && <p className={styles.formError}><AlertCircle size={14} />{deleteError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.resetBtn} onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleting} id="confirm-delete-platform-btn">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
