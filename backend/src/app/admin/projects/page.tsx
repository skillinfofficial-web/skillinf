'use client';

import React, { useEffect, useState, useRef, useCallback, DragEvent } from 'react';
import {
  FolderKanban, Trash2, X, GitBranch, AlertCircle,
  CheckCircle, Loader2, Upload, ExternalLink, Tag,
} from 'lucide-react';
import styles from './projects.module.css';

interface Domain { name: string; }
interface Project {
  _id: string;
  name: string;
  domain: string;
  image: string;
  githubLink: string;
  createdAt: string;
}

export default function AdminProjectsPage() {
  /* ── Domains ─────────────────────────────────────────────── */
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domsLoading, setDomsLoading] = useState(true);

  /* ── Projects list ───────────────────────────────────────── */
  const [projects, setProjects] = useState<Project[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  /* ── Form ────────────────────────────────────────────────── */
  const [domain, setDomain] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Delete ──────────────────────────────────────────────── */
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* ── Load ────────────────────────────────────────────────── */
  const loadProjects = useCallback(() => {
    setListLoading(true); setListError('');
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => { if (d.success) setProjects(d.items); else setListError(d.message || 'Failed.'); })
      .catch(() => setListError('Network error.'))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/domains')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setDomains(d.domains);
          if (d.domains.length > 0) setDomain(d.domains[0].name);
        }
      })
      .catch(() => {})
      .finally(() => setDomsLoading(false));
    loadProjects();
  }, [loadProjects]);

  /* ── Image upload ────────────────────────────────────────── */
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
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const resetForm = () => {
    setDomain(domains.length > 0 ? domains[0].name : '');
    setImage(null); setName(''); setGithubLink('');
    setFormError(''); setFormSuccess('');
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!domain) { setFormError('Please select a domain.'); return; }
    if (!image) { setFormError('Please upload a WebP image.'); return; }
    if (!name.trim()) { setFormError('Project name is required.'); return; }
    if (!githubLink.trim()) { setFormError('GitHub link is required.'); return; }
    try { new URL(githubLink); } catch { setFormError('Enter a valid URL (include https://).'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), domain, image, githubLink: githubLink.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess('Project added successfully!');
        resetForm();
        loadProjects();
        setTimeout(() => setFormSuccess(''), 3000);
      } else {
        setFormError(data.message || 'Failed to add project.');
      }
    } catch { setFormError('Network error.'); }
    finally { setSubmitting(false); }
  };

  /* ── Delete ──────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget._id }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects((p) => p.filter((x) => x._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else setDeleteError(data.message || 'Failed to delete.');
    } catch { setDeleteError('Network error.'); }
    finally { setDeleting(false); }
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* ── Page Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.desc}>
            Upload student projects — they appear as cards on the public Projects page.
          </p>
        </div>
        <div className={styles.countBadge}>
          <FolderKanban size={14} />
          {listLoading ? '…' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        </div>
      </header>

      {/* ── Add Project Form (always visible) ── */}
      <div className={styles.addCard}>
        <p className={styles.addCardTitle}>Add New Project</p>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* 1. Domain Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="proj-domain">
              <Tag size={13} /> Domain Name <span className={styles.required}>*</span>
            </label>
            {domsLoading ? (
              <div className={styles.loadingRow}><Loader2 size={14} className={styles.spin} /> Loading domains…</div>
            ) : domains.length === 0 ? (
              <p className={styles.noDoms}>No domains found. Add domains first from the Domains section.</p>
            ) : (
              <select
                id="proj-domain"
                className={styles.select}
                value={domain}
                onChange={(e) => { setDomain(e.target.value); setFormError(''); }}
              >
                {domains.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Upload Image */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Upload size={13} /> Upload Image <span className={styles.required}>*</span>
              <span className={styles.webpBadge}>WebP only</span>
            </label>

            {/* Size placeholder guide */}
            <div className={styles.sizeGuide}>
              <span className={styles.sizeGuideIcon}>📐</span>
              <span>
                Upload a <strong>16:9</strong> image for best display across all devices.{' '}
                Recommended: <strong>800 × 450 px</strong>
              </span>
            </div>

            {!image ? (
              <div
                className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                {/* Visual 16:9 placeholder skeleton */}
                <div className={styles.imgPlaceholder}>
                  <div className={styles.imgPlaceholderInner}>
                    <Upload size={28} className={styles.uploadIcon} />
                    <p className={styles.dropTitle}>Click or drag &amp; drop</p>
                    <p className={styles.dropHint}>WebP · 800 × 450 px (16:9)</p>
                  </div>
                  <div className={styles.aspectRatio}>16 : 9</div>
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

          {/* 3. Project Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="proj-name">
              Name of the Project <span className={styles.required}>*</span>
            </label>
            <input
              id="proj-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => { setName(e.target.value); setFormError(''); }}
              placeholder="e.g. AI Image Classifier"
            />
          </div>

          {/* 4. GitHub Link */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="proj-github">
              <GitBranch size={13} /> GitHub Link of the Project <span className={styles.required}>*</span>
            </label>
            <input
              id="proj-github"
              type="url"
              className={styles.input}
              value={githubLink}
              onChange={(e) => { setGithubLink(e.target.value); setFormError(''); }}
              placeholder="https://github.com/username/repository"
            />
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
            <button type="submit" id="submit-project-btn" className={styles.submitBtn} disabled={submitting}>
              {submitting
                ? <><Loader2 size={14} className={styles.spin} /> Saving…</>
                : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Projects List ── */}
      {listLoading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spin} />
          <span>Loading projects…</span>
        </div>
      )}
      {listError && !listLoading && (
        <div className={`${styles.stateBox} ${styles.stateError}`}>
          <AlertCircle size={20} /><span>{listError}</span>
        </div>
      )}
      {!listLoading && !listError && projects.length === 0 && (
        <div className={styles.stateBox}>
          <FolderKanban size={36} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No projects yet</p>
          <p className={styles.emptyHint}>Fill in the form above and click Submit to add your first project.</p>
        </div>
      )}

      {!listLoading && !listError && projects.length > 0 && (
        <div className={styles.list}>
          {projects.map((proj, i) => (
            <div key={proj._id} className={styles.row}>
              {/* Image */}
              <div className={styles.rowImgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proj.image} alt={proj.name} className={styles.rowImg} />
              </div>

              {/* Info */}
              <div className={styles.rowInfo}>
                <span className={styles.rowDomain}>{proj.domain}</span>
                <p className={styles.rowName}>{proj.name}</p>
                <a
                  href={proj.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.rowGithub}
                >
                  <GitBranch size={12} /> View on GitHub <ExternalLink size={10} />
                </a>
              </div>

              {/* Date + Delete */}
              <div className={styles.rowActions}>
                <span className={styles.rowDate}>
                  {new Date(proj.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <button
                  className={styles.deleteBtn}
                  id={`delete-project-${i}`}
                  title="Delete project"
                  onClick={() => { setDeleteTarget(proj); setDeleteError(''); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={`${styles.modalIcon} ${styles.modalIconDanger}`}><Trash2 size={18} /></div>
              <div>
                <h2 className={styles.modalTitle}>Delete Project?</h2>
                <p className={styles.modalSub}>
                  &ldquo;<strong>{deleteTarget.name}</strong>&rdquo; will be permanently removed. This cannot be undone.
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
                id="confirm-delete-project-btn"
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
