'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Award, Plus, Trash2, X, AlertCircle, CheckCircle,
  Loader2, Pencil, Upload, Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import styles from './eventCerts.module.css';

/* ── Types ───────────────────────────────────────────────────────── */
interface Program { _id: string; name: string; }

interface EvTemplate {
  label:    string;
  imageUrl: string;
  order:    number;
}

interface EvPrize {
  label:         string;   // e.g. "1st Prize"
  email:         string;
  templateIndex: number;
}

interface EvContent {
  templateIndex: number;
  topText:       string;
  topColor:      string;
  bodyText:      string;
  bodyColor:     string;
  nameColor:     string;
  nameYPct:      number;  // 0-100 (% from top)
  topFontSize:   number;
  nameFontSize:  number;
  bodyFontSize:  number;
}

interface EvCertDoc {
  _id:         string;
  programId:   string;
  programName: string;
  templates:   EvTemplate[];
  participants: string[];
  prizes:      EvPrize[];
  contents:    EvContent[];
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function defaultContent(templateIndex: number): EvContent {
  return {
    templateIndex,
    topText:      '',
    topColor:     '#1a1a1a',
    bodyText:     '',
    bodyColor:    '#1a1a1a',
    nameColor:    '#1a3a2a',
    nameYPct:     50,
    topFontSize:  22,
    nameFontSize: 36,
    bodyFontSize: 18,
  };
}

const EMPTY_FORM = {
  programId:   '',
  programName: '',
};

/* ── Component ───────────────────────────────────────────────────── */
export default function EventCertsAdminPage() {
  /* programs dropdown */
  const [programs, setPrograms]       = useState<Program[]>([]);
  /* list */
  const [certs,    setCerts]          = useState<EvCertDoc[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError,   setListError]   = useState('');

  /* form mode */
  const [editId, setEditId] = useState<string | null>(null);

  /* form fields */
  const [form, setForm] = useState({ ...EMPTY_FORM });

  /* templates */
  const [templates,       setTemplates]       = useState<EvTemplate[]>([]);
  const [uploading,       setUploading]       = useState<number | null>(null); // index being uploaded
  const templateFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* participants CSV */
  const [participants, setParticipants] = useState<string[]>([]);
  const csvRef = useRef<HTMLInputElement>(null);

  /* prizes */
  const [prizes, setPrizes] = useState<EvPrize[]>([]);

  /* contents (one per template) */
  const [contents, setContents] = useState<EvContent[]>([]);

  /* expanded content accordion index */
  const [openContent, setOpenContent] = useState<number | null>(0);

  /* form status */
  const [formError,   setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  /* delete */
  const [deleteTarget, setDeleteTarget] = useState<EvCertDoc | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  /* ── Load data ──────────────────────────────────────────────── */
  const loadCerts = useCallback(() => {
    setListLoading(true); setListError('');
    fetch('/api/event-certificates')
      .then((r) => r.json())
      .then((d) => { if (d.success) setCerts(d.data); else setListError(d.message || 'Failed.'); })
      .catch(() => setListError('Network error.'))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    loadCerts();
    fetch('/api/programs')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPrograms(d.programs); })
      .catch(() => {});
  }, [loadCerts]);

  /* ── Sync contents when templates change ────────────────────── */
  const syncContents = useCallback((tmpls: EvTemplate[], prev: EvContent[]) => {
    return tmpls.map((_, i) => prev.find((c) => c.templateIndex === i) ?? defaultContent(i));
  }, []);

  /* ── Template helpers ───────────────────────────────────────── */
  const addTemplate = () => {
    const next: EvTemplate[] = [...templates, { label: `Template ${templates.length + 1}`, imageUrl: '', order: templates.length }];
    setTemplates(next);
    setContents(syncContents(next, contents));
    setOpenContent(next.length - 1);
  };

  const removeTemplate = (i: number) => {
    const next = templates.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, order: idx }));
    setTemplates(next);
    const nextC = syncContents(next, contents.filter((c) => c.templateIndex !== i).map((c, idx) => ({ ...c, templateIndex: idx })));
    setContents(nextC);
    setPrizes((p) => p.filter((pr) => pr.templateIndex !== i).map((pr) => ({ ...pr, templateIndex: pr.templateIndex > i ? pr.templateIndex - 1 : pr.templateIndex })));
    setOpenContent((prev) => (prev !== null && prev >= next.length ? next.length - 1 : prev));
  };

  const uploadTemplateImage = async (i: number, file: File) => {
    setUploading(i);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/event-certificates/upload-template', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) => prev.map((t, idx) => idx === i ? { ...t, imageUrl: data.url } : t));
        setFormError('');
      } else {
        setFormError(data.message || 'Upload failed.');
      }
    } catch {
      setFormError('Upload failed — network error.');
    } finally {
      setUploading(null);
    }
  };

  /* ── CSV upload ─────────────────────────────────────────────── */
  const handleCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text   = e.target?.result as string ?? '';
      const emails = text
        .split(/[\r\n,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.includes('@'));
      setParticipants(emails);
      setFormError('');
    };
    reader.readAsText(file);
  };

  /* ── Prize helpers ──────────────────────────────────────────── */
  const addPrize = () => {
    const idx = prizes.length;
    const ordinal = idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`;
    setPrizes([...prizes, { label: `${ordinal} Prize`, email: '', templateIndex: Math.min(1, templates.length - 1) }]);
  };

  /* ── Content field helper ───────────────────────────────────── */
  const setContent = (i: number, patch: Partial<EvContent>) => {
    setContents((prev) => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  };

  /* ── Reset ──────────────────────────────────────────────────── */
  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setTemplates([]); setParticipants([]); setPrizes([]); setContents([]);
    setFormError(''); setFormSuccess(''); setEditId(null); setOpenContent(0);
  };

  /* ── Populate for edit ──────────────────────────────────────── */
  const startEdit = (doc: EvCertDoc) => {
    setEditId(doc._id);
    setForm({ programId: doc.programId, programName: doc.programName });
    setTemplates(doc.templates);
    setParticipants(doc.participants);
    setPrizes(doc.prizes);
    setContents(doc.contents.length ? doc.contents : doc.templates.map((_, i) => defaultContent(i)));
    setFormError(''); setFormSuccess(''); setOpenContent(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');

    if (!form.programId)
      return setFormError('Please select a program.');
    if (templates.length === 0)
      return setFormError('Add at least one certificate template.');
    if (templates.some((t) => !t.imageUrl))
      return setFormError('Upload an image for every template.');
    if (templates.some((t) => !t.label.trim()))
      return setFormError('Every template must have a label.');
    if (prizes.some((p) => !p.email.trim()))
      return setFormError('Fill the email for every prize entry.');

    setSubmitting(true);
    const payload = {
      id:           editId ?? undefined,
      programId:    form.programId,
      programName:  form.programName,
      templates,
      participants,
      prizes,
      contents,
    };
    try {
      const res  = await fetch('/api/event-certificates', {
        method:  editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess(editId ? 'Certificate config updated!' : 'Certificate config created!');
        resetForm(); loadCerts();
        setTimeout(() => setFormSuccess(''), 3000);
      } else {
        setFormError(data.message || 'Failed.');
      }
    } catch {
      setFormError('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      const res  = await fetch('/api/event-certificates', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: deleteTarget._id }),
      });
      const data = await res.json();
      if (data.success) { setCerts((c) => c.filter((x) => x._id !== deleteTarget._id)); setDeleteTarget(null); }
      else setDeleteError(data.message || 'Failed.');
    } catch { setDeleteError('Network error.'); }
    finally { setDeleting(false); }
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Event Certificates</h1>
          <p className={styles.desc}>Create certificate configs for programs — templates, participants, prizes and content.</p>
        </div>
        <div className={styles.countBadge}>
          <Award size={14} />
          {listLoading ? '...' : `${certs.length} config${certs.length !== 1 ? 's' : ''}`}
        </div>
      </header>

      {/* ── Form Card ── */}
      <div className={styles.addCard}>
        <p className={styles.addCardTitle}>
          {editId
            ? <><Pencil size={15} className={styles.addCardIcon} /> Edit Certificate Config</>
            : <><Plus   size={15} className={styles.addCardIcon} /> Add Certificate Config</>}
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* 1 — Program */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="ec-program">
              Event / Program <span className={styles.required}>*</span>
            </label>
            <select
              id="ec-program"
              className={styles.select}
              value={form.programId}
              onChange={(e) => {
                const prog = programs.find((p) => p._id === e.target.value);
                setForm({ programId: e.target.value, programName: prog?.name ?? '' });
                setFormError('');
              }}
            >
              <option value="">— Select a program —</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 2 — Templates */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                Certificate Templates <span className={styles.required}>*</span>
              </label>
              <button type="button" className={styles.addRowBtn} onClick={addTemplate}>
                <Plus size={13} /> Add Template
              </button>
            </div>

            {templates.length === 0 && (
              <p className={styles.hint}>No templates yet. Click &ldquo;Add Template&rdquo; to start.</p>
            )}

            {templates.map((tpl, i) => (
              <div key={i} className={styles.tplRow}>
                <div className={styles.tplMeta}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={`Label (e.g. Participant, 1st Prize)`}
                    value={tpl.label}
                    onChange={(e) => setTemplates((prev) => prev.map((t, idx) => idx === i ? { ...t, label: e.target.value } : t))}
                  />
                  <div className={styles.tplUploadWrap}>
                    <button
                      type="button"
                      className={styles.uploadBtn}
                      onClick={() => templateFileRefs.current[i]?.click()}
                      disabled={uploading === i}
                    >
                      {uploading === i
                        ? <><Loader2 size={13} className={styles.spin} /> Uploading...</>
                        : <><Upload size={13} /> {tpl.imageUrl ? 'Replace Image' : 'Upload Background'}</>}
                    </button>
                    <input
                      ref={(el) => { templateFileRefs.current[i] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className={styles.hiddenInput}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTemplateImage(i, f); }}
                    />
                    {tpl.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={tpl.imageUrl} alt={tpl.label} className={styles.tplThumb} />
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeTemplate(i)}
                  title="Remove template"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 3 — Participants CSV */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                <Users size={12} /> Participants Data (CSV of emails)
              </label>
              <button type="button" className={styles.addRowBtn} onClick={() => csvRef.current?.click()}>
                <Upload size={13} /> Upload CSV
              </button>
            </div>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className={styles.hiddenInput}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsv(f); e.target.value = ''; }}
            />
            {participants.length > 0 ? (
              <p className={styles.csvInfo}>
                <CheckCircle size={13} /> {participants.length} participant email{participants.length !== 1 ? 's' : ''} loaded
              </p>
            ) : (
              <p className={styles.hint}>Upload a CSV with one email per line (or comma-separated).</p>
            )}
          </div>

          {/* 4 — Prizes */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Prize Entries</label>
              <button type="button" className={styles.addRowBtn} onClick={addPrize} disabled={templates.length === 0}>
                <Plus size={13} /> Add Prize
              </button>
            </div>

            {prizes.length === 0 && (
              <p className={styles.hint}>No prizes added. Click &ldquo;Add Prize&rdquo; to add prize winners.</p>
            )}

            {prizes.map((pr, i) => (
              <div key={i} className={styles.prizeRow}>
                {/* Label */}
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Prize label (e.g. 1st Prize)"
                  value={pr.label}
                  onChange={(e) => setPrizes((prev) => prev.map((p, idx) => idx === i ? { ...p, label: e.target.value } : p))}
                />
                {/* Email */}
                <input
                  type="email"
                  className={styles.input}
                  placeholder="Winner email"
                  value={pr.email}
                  onChange={(e) => setPrizes((prev) => prev.map((p, idx) => idx === i ? { ...p, email: e.target.value } : p))}
                />
                {/* Template assignment */}
                <select
                  className={styles.select}
                  value={pr.templateIndex}
                  onChange={(e) => setPrizes((prev) => prev.map((p, idx) => idx === i ? { ...p, templateIndex: Number(e.target.value) } : p))}
                >
                  {templates.map((t, ti) => (
                    <option key={ti} value={ti}>{t.label || `Template ${ti + 1}`}</option>
                  ))}
                </select>
                <button type="button" className={styles.removeBtn} onClick={() => setPrizes((prev) => prev.filter((_, idx) => idx !== i))}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 5 — Certificate Contents (one accordion per template) */}
          {templates.length > 0 && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Certificate Content</label>
              <p className={styles.hint}>
                Landscape orientation (1123 x 794 px). The name is placed between Top and Body text.
              </p>

              {contents.map((c, i) => (
                <div key={i} className={styles.contentCard}>
                  {/* Accordion header */}
                  <button
                    type="button"
                    className={styles.contentCardHeader}
                    onClick={() => setOpenContent(openContent === i ? null : i)}
                  >
                    <span className={styles.contentCardTitle}>
                      {templates[i]?.label || `Template ${i + 1}`}
                    </span>
                    {openContent === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {openContent === i && (
                    <div className={styles.contentCardBody}>

                      {/* Top text */}
                      <div className={styles.contentRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.labelSm}>Top Content (above name)</label>
                          <textarea
                            className={styles.textarea}
                            rows={3}
                            placeholder="Text shown above the participant name..."
                            value={c.topText}
                            onChange={(e) => setContent(i, { topText: e.target.value })}
                          />
                        </div>
                        <div className={styles.colorGroup}>
                          <label className={styles.labelSm}>Top Text Colour</label>
                          <input type="color" className={styles.colorInput} value={c.topColor}
                            onChange={(e) => setContent(i, { topColor: e.target.value })} />
                        </div>
                        <div className={styles.sizeGroup}>
                          <label className={styles.labelSm}>Font Size (px)</label>
                          <input type="number" className={styles.input} min={10} max={80} value={c.topFontSize}
                            onChange={(e) => setContent(i, { topFontSize: Number(e.target.value) })} />
                        </div>
                      </div>

                      {/* Name position + colour */}
                      <div className={styles.contentRow}>
                        <div className={styles.fieldGroup} style={{ flex: 2 }}>
                          <label className={styles.labelSm}>Name Y Position (% from top, landscape)</label>
                          <div className={styles.sliderRow}>
                            <input
                              type="range" min={10} max={90} step={1}
                              className={styles.slider}
                              value={c.nameYPct}
                              onChange={(e) => setContent(i, { nameYPct: Number(e.target.value) })}
                            />
                            <span className={styles.sliderVal}>{c.nameYPct}%</span>
                          </div>
                        </div>
                        <div className={styles.colorGroup}>
                          <label className={styles.labelSm}>Name Colour</label>
                          <input type="color" className={styles.colorInput} value={c.nameColor}
                            onChange={(e) => setContent(i, { nameColor: e.target.value })} />
                        </div>
                        <div className={styles.sizeGroup}>
                          <label className={styles.labelSm}>Font Size (px)</label>
                          <input type="number" className={styles.input} min={10} max={120} value={c.nameFontSize}
                            onChange={(e) => setContent(i, { nameFontSize: Number(e.target.value) })} />
                        </div>
                      </div>

                      {/* Body text */}
                      <div className={styles.contentRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.labelSm}>Body Content (below name)</label>
                          <textarea
                            className={styles.textarea}
                            rows={3}
                            placeholder="Text shown below the participant name..."
                            value={c.bodyText}
                            onChange={(e) => setContent(i, { bodyText: e.target.value })}
                          />
                        </div>
                        <div className={styles.colorGroup}>
                          <label className={styles.labelSm}>Body Text Colour</label>
                          <input type="color" className={styles.colorInput} value={c.bodyColor}
                            onChange={(e) => setContent(i, { bodyColor: e.target.value })} />
                        </div>
                        <div className={styles.sizeGroup}>
                          <label className={styles.labelSm}>Font Size (px)</label>
                          <input type="number" className={styles.input} min={10} max={80} value={c.bodyFontSize}
                            onChange={(e) => setContent(i, { bodyFontSize: Number(e.target.value) })} />
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Errors / Success */}
          {formError   && <p className={styles.formError}><AlertCircle size={14} />{formError}</p>}
          {formSuccess && <p className={styles.formSuccess}><CheckCircle size={14} />{formSuccess}</p>}

          {/* Actions */}
          <div className={styles.formActions}>
            <button type="button" className={styles.resetBtn} onClick={resetForm} disabled={submitting}>
              {editId ? 'Cancel Edit' : 'Reset'}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting
                ? <><Loader2 size={14} className={styles.spin} /> {editId ? 'Updating...' : 'Saving...'}</>
                : editId
                  ? <><Pencil size={14} /> Update Config</>
                  : <><Plus   size={14} /> Save Config</>}
            </button>
          </div>
        </form>
      </div>

      {/* ── Saved configs list ── */}
      {listLoading && (
        <div className={styles.stateBox}><Loader2 size={26} className={styles.spin} /><span>Loading...</span></div>
      )}
      {listError && !listLoading && (
        <div className={`${styles.stateBox} ${styles.stateError}`}><AlertCircle size={20} /><span>{listError}</span></div>
      )}
      {!listLoading && !listError && certs.length === 0 && (
        <div className={styles.stateBox}>
          <Award size={36} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No certificate configs yet</p>
          <p className={styles.emptyHint}>Fill the form above and click &ldquo;Save Config&rdquo;.</p>
        </div>
      )}

      {!listLoading && !listError && certs.length > 0 && (
        <div className={styles.list}>
          {certs.map((doc, i) => (
            <div key={doc._id} className={`${styles.row} ${editId === doc._id ? styles.rowEditing : ''}`}>
              <div className={styles.rowIcon}><Award size={20} /></div>
              <div className={styles.rowInfo}>
                <p className={styles.rowName}>{doc.programName}</p>
                <div className={styles.rowMeta}>
                  <span>{doc.templates.length} template{doc.templates.length !== 1 ? 's' : ''}</span>
                  <span className={styles.dot} />
                  <span>{doc.participants.length} participant{doc.participants.length !== 1 ? 's' : ''}</span>
                  <span className={styles.dot} />
                  <span>{doc.prizes.length} prize{doc.prizes.length !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.tplChips}>
                  {doc.templates.map((t, ti) => (
                    <span key={ti} className={styles.tplChip}>{t.label}</span>
                  ))}
                </div>
              </div>
              <div className={styles.rowActions}>
                <button className={styles.editBtn} title="Edit" id={`edit-ec-${i}`} onClick={() => startEdit(doc)}>
                  <Pencil size={13} />
                </button>
                <button className={styles.deleteBtn} title="Delete" id={`delete-ec-${i}`}
                  onClick={() => { setDeleteTarget(doc); setDeleteError(''); }}>
                  <Trash2 size={13} />
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
                <h2 className={styles.modalTitle}>Delete Certificate Config?</h2>
                <p className={styles.modalSub}>
                  Config for &ldquo;<strong>{deleteTarget.programName}</strong>&rdquo; will be permanently removed.
                </p>
              </div>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            {deleteError && <p className={styles.formError}><AlertCircle size={14} />{deleteError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.resetBtn} onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleting} id="confirm-delete-ec-btn">
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
