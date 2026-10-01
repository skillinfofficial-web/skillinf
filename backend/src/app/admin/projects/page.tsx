'use client';

import React, { useEffect, useState, useRef, useCallback, DragEvent } from 'react';
import {
  FolderKanban, Plus, Trash2, X, GitBranch, AlertCircle,
  CheckCircle, Loader2, Upload, ExternalLink,
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
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [image, setImage] = useState<string | null>(null);
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
    setDomsLoading(true);
    fetch('/api/domains')
      .then((r) => r.json())
      .then((d) => { if (d.success) { setDomains(d.domains); if (d.domains.length > 0) setDomain(d.domains[0].name); } })
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
  const onDropZoneDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDropZoneDragLeave = () => setDragging(false);
  const onDropZoneDrop = (e: DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!name.trim()) { setFormError('Project name is required.'); return; }
    if (!domain) { setFormError('Please select a domain.'); return; }
    if (!image) { setFormError('Please upload a WebP image.'); return; }
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
        setName(''); setImage(null); setGithubLink('');
        if (domains.length > 0) setDomain(domains[0].name);
        loadProjects();
        setTimeout(() => { setFormSuccess(''); setShowForm(false); }, 2000);
      } else { setFormError(data.message || 'Failed to add project.'); }
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
      if (data.success) { setProjects((p) => p.filter((x) => x._id !== deleteTarget._id)); setDeleteTarget(null); }
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
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.desc}>Upload student projects — they appear as cards on the public Projects page.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.countBadge}>
            <FolderKanban size={14} />
            {listLoading ? '…' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </span>
          <button
            id="add-project-btn"
            className={styles.addBtn}
            onClick={() => { setShowForm((p) => !p); setFormError(''); setFormSuccess(''); }}
          >
            <Plus size={15} />
            {showForm ? 'Close Form' : 'Add Project'}
          </button>
        </div>
      </header>

      {/* ── Add Form ── */}
      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>New Project</h2>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>

            {/* Domain */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="proj-domain">
                Domain <span className={styles.required}>*</span>
              </label>
              {domsLoading ? (
                <div className={styles.domsLoading}><Loader2 size={14} className={styles.spin} /> Loading domains…</div>
              ) : domains.length === 0 ? (
                <p className={styles.noDoms}>No domains found. Add domains first from the Domains section.</p>
              ) : (
                <select
                  id="proj-domain"
                  className={styles.select}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  {domains.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Image Upload */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Project Image <span className={styles.required}>*</span>
                <span className={styles.formatHint}>WebP only</span>
              </label>
              <div className={styles.imageSizeNote}>
                <span className={styles.imageSizeIcon}>📐</span>
                <span>Recommended size: <strong>800 × 450 px (16:9)</strong> — fits perfectly on all device screens without cropping or stretching.</span>
              </div>
              {!image ? (
                <div
                  className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={onDropZoneDragOver}
                  onDragLeave={onDropZoneDragLeave}
                  onDrop={onDropZoneDrop}
                >
                  <Upload size={32} className={styles.dropIcon} />
                  <p className={styles.dropTitle}>Click or drag &amp; drop to upload</p>
                  <p className={styles.dropHint}>WebP format only · Recommended: 800×450 px</p>
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
                  <button type="button" className={styles.removeImg} onClick={() => setImage(null)} title="Remove image">
                    <X size={14} /> Remove
                  </button>
                </div>
              )}
            </div>

            {/* Project Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="proj-name">
                Project Name <span className={styles.required}>*</span>
              </label>
              <input
                id="proj-name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Image Classifier"
              />
            </div>

            {/* GitHub Link */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="proj-github">
                GitHub Link <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputIcon}>
                <GitBranch size={16} className={styles.inputIconIcon} />
                <input
                  id="proj-github"
                  type="url"
                  className={styles.inputWithIcon}
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </div>

            {formError && (
              <p className={styles.formError}><AlertCircle size={14} />{formError}</p>
            )}
            {formSuccess && (
              <p className={styles.formSuccess}><CheckCircle size={14} />{formSuccess}</p>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setShowForm(false); setFormError(''); setFormSuccess(''); setImage(null); setName(''); setGithubLink(''); }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" id="submit-project-btn" className={styles.submitBtn} disabled={submitting}>
                {submitting ? <><Loader2 size={15} className={styles.spin} /> Saving…</> : <><Plus size={15} /> Add Project</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── List States ── */}
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
          <p className={styles.emptyHint}>Click &ldquo;Add Project&rdquo; above to upload the first one.</p>
        </div>
      )}

      {/* ── Projects Grid ── */}
      {!listLoading && !listError && projects.length > 0 && (
        <div className={styles.grid}>
          {projects.map((proj, i) => (
            <div key={proj._id} className={styles.card}>
              <div className={styles.cardImgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proj.image} alt={proj.name} className={styles.cardImg} />
                <span className={styles.domainBadge}>{proj.domain}</span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardName}>{proj.name}</p>
                <a
                  href={proj.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.githubLink}
                  title="Open GitHub"
                >
                  <GitBranch size={13} /> View on GitHub <ExternalLink size={11} />
                </a>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.cardDate}>
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

      {/* ── Delete Modal ── */}
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
              <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleting} id="confirm-delete-project-btn">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
