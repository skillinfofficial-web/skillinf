'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Layers, Plus, Trash2, X, AlertCircle, CheckCircle,
  Loader2, Link2, Pencil, ExternalLink, Monitor,
} from 'lucide-react';
import styles from './programs.module.css';

interface Platform { name: string; image: string; }
interface Program {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  platformName: string;
  platformImage: string | null;
  link: string;
  createdAt: string;
}

type FormMode = 'add' | 'edit';

const EMPTY_FORM = { name: '', startDate: '', endDate: '', platformName: '', platformImage: null as string | null, link: '' };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProgramsAdminPage() {
  /* ── Data ────────────────────────────────────────────────── */
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError]     = useState('');

  /* ── Form state ──────────────────────────────────────────── */
  const [mode, setMode]     = useState<FormMode>('add');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm]     = useState({ ...EMPTY_FORM });
  const [formError, setFormError]     = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  /* ── Delete ──────────────────────────────────────────────── */
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState('');

  /* ── Load ────────────────────────────────────────────────── */
  const loadPrograms = useCallback(() => {
    setListLoading(true); setListError('');
    fetch('/api/programs')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPrograms(d.programs); else setListError(d.message || 'Failed.'); })
      .catch(() => setListError('Network error.'))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    loadPrograms();
    fetch('/api/platforms')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPlatforms(d.platforms); })
      .catch(() => {});
  }, [loadPrograms]);

  /* ── Platform selection → auto-fill image ────────────────── */
  const onPlatformChange = (pName: string) => {
    const found = platforms.find((p) => p.name === pName);
    setForm((f) => ({ ...f, platformName: pName, platformImage: found?.image ?? null }));
    setFormError('');
  };

  /* ── Reset / Open Edit ───────────────────────────────────── */
  const resetForm = () => { setForm({ ...EMPTY_FORM }); setFormError(''); setFormSuccess(''); setMode('add'); setEditId(null); };
  const openEdit = (prog: Program) => {
    setMode('edit'); setEditId(prog._id);
    setForm({
      name: prog.name,
      startDate: prog.startDate.split('T')[0],
      endDate: prog.endDate.split('T')[0],
      platformName: prog.platformName,
      platformImage: prog.platformImage,
      link: prog.link,
    });
    setFormError(''); setFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Submit (Add / Edit) ─────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!form.name.trim())        { setFormError('Program name is required.');       return; }
    if (!form.startDate)          { setFormError('Start date is required.');          return; }
    if (!form.endDate)            { setFormError('End date is required.');            return; }
    if (new Date(form.endDate) < new Date(form.startDate)) { setFormError('End date must be after start date.'); return; }
    if (!form.platformName)       { setFormError('Please select a platform.');        return; }
    if (!form.link.trim())        { setFormError('Event / program link is required.'); return; }
    try { new URL(form.link); } catch { setFormError('Enter a valid URL (include https://).'); return; }

    setSubmitting(true);
    const payload = { ...form, name: form.name.trim(), link: form.link.trim(), ...(mode === 'edit' ? { id: editId } : {}) };
    try {
      const res = await fetch('/api/programs', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess(mode === 'edit' ? 'Program updated successfully!' : 'Program created successfully!');
        resetForm(); loadPrograms();
        setTimeout(() => setFormSuccess(''), 3000);
      } else { setFormError(data.message || 'Failed.'); }
    } catch { setFormError('Network error.'); }
    finally { setSubmitting(false); }
  };

  /* ── Delete ──────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      const res = await fetch('/api/programs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget._id }),
      });
      const data = await res.json();
      if (data.success) { setPrograms((p) => p.filter((x) => x._id !== deleteTarget._id)); setDeleteTarget(null); }
      else setDeleteError(data.message || 'Failed to delete.');
    } catch { setDeleteError('Network error.'); }
    finally { setDeleting(false); }
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Programs</h1>
          <p className={styles.desc}>Create and manage programs / events shown on the public site.</p>
        </div>
        <div className={styles.countBadge}>
          <Layers size={14} />
          {listLoading ? '…' : `${programs.length} program${programs.length !== 1 ? 's' : ''}`}
        </div>
      </header>

      {/* ── Form Card ── */}
      <div className={styles.addCard}>
        <p className={styles.addCardTitle}>
          {mode === 'edit'
            ? <><Pencil size={15} className={styles.addCardIcon} /> Edit Program</>
            : <><Plus size={15} className={styles.addCardIcon} /> Add Program</>}
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* 1 — Program Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="prog-name">
              Name of the Program <span className={styles.required}>*</span>
            </label>
            <input
              id="prog-name" type="text" className={styles.input}
              value={form.name}
              onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormError(''); }}
              placeholder="e.g. Google Summer of Code 2025"
            />
          </div>

          {/* 2 — Start & End Date */}
          <div className={styles.dateRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="prog-start">
                Start Date <span className={styles.required}>*</span>
              </label>
              <input
                id="prog-start" type="date" className={styles.input}
                value={form.startDate}
                onChange={(e) => { setForm((f) => ({ ...f, startDate: e.target.value })); setFormError(''); }}
              />
            </div>
            <div className={styles.dateSep}>→</div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="prog-end">
                End Date <span className={styles.required}>*</span>
              </label>
              <input
                id="prog-end" type="date" className={styles.input}
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => { setForm((f) => ({ ...f, endDate: e.target.value })); setFormError(''); }}
              />
            </div>
          </div>

          {/* 3 — Platform Dropdown */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="prog-platform">
              <Monitor size={12} /> Platform <span className={styles.required}>*</span>
            </label>
            {platforms.length === 0 ? (
              <p className={styles.noPlatforms}>
                No platforms found. Add platforms first from the <strong>Platforms</strong> section.
              </p>
            ) : (
              <>
                <select
                  id="prog-platform"
                  className={styles.select}
                  value={form.platformName}
                  onChange={(e) => onPlatformChange(e.target.value)}
                >
                  <option value="">— Select a platform —</option>
                  {platforms.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>

                {/* Show platform image preview when selected */}
                {form.platformImage && (
                  <div className={styles.platformPreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.platformImage} alt={form.platformName} className={styles.platformPreviewImg} />
                    <span className={styles.platformPreviewLabel}>{form.platformName}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 4 — Event / Program Link */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="prog-link">
              <Link2 size={12} /> Link of the Event / Program <span className={styles.required}>*</span>
            </label>
            <input
              id="prog-link" type="url" className={styles.input}
              value={form.link}
              onChange={(e) => { setForm((f) => ({ ...f, link: e.target.value })); setFormError(''); }}
              placeholder="https://example.com/event"
            />
          </div>

          {formError   && <p className={styles.formError}><AlertCircle size={14} />{formError}</p>}
          {formSuccess && <p className={styles.formSuccess}><CheckCircle size={14} />{formSuccess}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.resetBtn} onClick={resetForm} disabled={submitting}>
              {mode === 'edit' ? 'Cancel Edit' : 'Reset'}
            </button>
            <button type="submit" id={mode === 'edit' ? 'update-program-btn' : 'add-program-btn'} className={styles.submitBtn} disabled={submitting}>
              {submitting
                ? <><Loader2 size={14} className={styles.spin} /> {mode === 'edit' ? 'Updating…' : 'Creating…'}</>
                : mode === 'edit' ? <><Pencil size={14} /> Update Program</> : <><Plus size={14} /> Add Program</>}
            </button>
          </div>
        </form>
      </div>

      {/* ── List ── */}
      {listLoading && (
        <div className={styles.stateBox}><Loader2 size={26} className={styles.spin} /><span>Loading programs…</span></div>
      )}
      {listError && !listLoading && (
        <div className={`${styles.stateBox} ${styles.stateError}`}><AlertCircle size={20} /><span>{listError}</span></div>
      )}
      {!listLoading && !listError && programs.length === 0 && (
        <div className={styles.stateBox}>
          <Layers size={36} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No programs yet</p>
          <p className={styles.emptyHint}>Fill the form above and click &ldquo;Add Program&rdquo;.</p>
        </div>
      )}

      {!listLoading && !listError && programs.length > 0 && (
        <div className={styles.list}>
          {programs.map((prog, i) => (
            <div key={prog._id} className={`${styles.row} ${editId === prog._id ? styles.rowEditing : ''}`}>

              {/* Platform image */}
              <div className={styles.rowThumb}>
                {prog.platformImage
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={prog.platformImage} alt={prog.platformName} className={styles.rowThumbImg} />
                  : <Monitor size={20} className={styles.rowThumbIcon} />}
              </div>

              {/* Info */}
              <div className={styles.rowInfo}>
                <p className={styles.rowName}>{prog.name}</p>
                <div className={styles.rowMeta}>
                  <span className={styles.rowPlatform}>{prog.platformName}</span>
                  <span className={styles.rowDates}>{fmtDate(prog.startDate)} → {fmtDate(prog.endDate)}</span>
                </div>
              </div>

              {/* Link */}
              <a
                href={prog.link} target="_blank" rel="noopener noreferrer"
                className={styles.rowLink} title="Open link"
              >
                <ExternalLink size={13} /> Visit
              </a>

              {/* Actions */}
              <div className={styles.rowActions}>
                <button
                  className={styles.editBtn} title="Edit program"
                  id={`edit-program-${i}`} onClick={() => openEdit(prog)}
                ><Pencil size={13} /></button>
                <button
                  className={styles.deleteBtn} title="Delete program"
                  id={`delete-program-${i}`} onClick={() => { setDeleteTarget(prog); setDeleteError(''); }}
                ><Trash2 size={13} /></button>
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
                <h2 className={styles.modalTitle}>Delete Program?</h2>
                <p className={styles.modalSub}>&ldquo;<strong>{deleteTarget.name}</strong>&rdquo; will be permanently removed.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            {deleteError && <p className={styles.formError}><AlertCircle size={14} />{deleteError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.resetBtn} onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleting} id="confirm-delete-program-btn">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
