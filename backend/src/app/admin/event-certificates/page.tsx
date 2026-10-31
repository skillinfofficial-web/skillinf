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
  label:         string;
  email:         string;
  templateIndex: number;
}

interface EvContent {
  templateIndex: number;
  /* Top text */
  topText:     string;
  topColor:    string;
  topXPct:     number;  // 0-100 horizontal %
  topYPct:     number;  // 0-100 vertical %
  topFontSize: number;
  /* Name */
  nameColor:    string;
  nameXPct:     number;
  nameYPct:     number;
  nameFontSize: number;
  /* Body text */
  bodyText:     string;
  bodyColor:    string;
  bodyXPct:     number;
  bodyYPct:     number;
  bodyFontSize: number;
}

interface EvCertDoc {
  _id:          string;
  programId:    string;
  programName:  string;
  templates:    EvTemplate[];
  participants: string[];
  prizes:       EvPrize[];
  contents:     EvContent[];
}

/* ── Defaults ────────────────────────────────────────────────────── */
function defaultContent(templateIndex: number): EvContent {
  return {
    templateIndex,
    topText: '', topColor: '#1a1a1a', topXPct: 50, topYPct: 30, topFontSize: 22,
    nameColor: '#1a3a2a',             nameXPct: 50, nameYPct: 50, nameFontSize: 36,
    bodyText: '', bodyColor: '#1a1a1a', bodyXPct: 50, bodyYPct: 68, bodyFontSize: 18,
  };
}

const CANVAS_W = 1123;
const CANVAS_H = 794;

/* ── Live preview canvas ─────────────────────────────────────────── */
function PreviewCanvas({
  imageUrl, content, sampleName,
}: { imageUrl: string; content: EvContent; sampleName: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const draw = () => {
      if (!ctx) return;
      /* background */
      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
          drawText();
        };
        img.onerror = () => {
          ctx.fillStyle = '#e8f0ea';
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
          drawText();
        };
        img.src = imageUrl;
      } else {
        ctx.fillStyle = '#e8f0ea';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        drawText();
      }
    };

    const drawText = () => {
      if (!ctx) return;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      /* Top text */
      if (content.topText) {
        ctx.font      = `bold ${content.topFontSize}px Inter, sans-serif`;
        ctx.fillStyle = content.topColor;
        wrapText(ctx, content.topText,
          content.topXPct / 100 * CANVAS_W,
          content.topYPct / 100 * CANVAS_H,
          CANVAS_W * 0.8, content.topFontSize * 1.4);
      }

      /* Name */
      const name = sampleName || 'Participant Name';
      ctx.font      = `bold ${content.nameFontSize}px Inter, sans-serif`;
      ctx.fillStyle = content.nameColor;
      ctx.fillText(name,
        content.nameXPct / 100 * CANVAS_W,
        content.nameYPct / 100 * CANVAS_H);

      /* Body text */
      if (content.bodyText) {
        ctx.font      = `${content.bodyFontSize}px Inter, sans-serif`;
        ctx.fillStyle = content.bodyColor;
        wrapText(ctx, content.bodyText,
          content.bodyXPct / 100 * CANVAS_W,
          content.bodyYPct / 100 * CANVAS_H,
          CANVAS_W * 0.8, content.bodyFontSize * 1.4);
      }

      /* QR placeholder */
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth   = 2;
      ctx.strokeRect(CANVAS_W - 110, CANVAS_H - 110, 90, 90);
      ctx.font      = '14px Inter, sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'center';
      ctx.fillText('QR', CANVAS_W - 65, CANVAS_H - 65);
    };

    draw();
  }, [imageUrl, content, sampleName]);

  return (
    <canvas
      ref={ref}
      width={CANVAS_W}
      height={CANVAS_H}
      className={styles.previewCanvas}
    />
  );
}

/* Multi-line text helper */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number,
) {
  const lines = text.split('\n');
  const totalLines: string[] = [];
  for (const line of lines) {
    const words = line.split(' ');
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && cur) {
        totalLines.push(cur); cur = w;
      } else { cur = test; }
    }
    totalLines.push(cur);
  }
  const startY = y - (totalLines.length - 1) * lineHeight / 2;
  totalLines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function EventCertsAdminPage() {
  const [programs,    setPrograms]    = useState<Program[]>([]);
  const [certs,       setCerts]       = useState<EvCertDoc[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError,   setListError]   = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [form,   setForm]   = useState({ programId: '', programName: '' });

  const [templates,  setTemplates]  = useState<EvTemplate[]>([]);
  const [uploading,  setUploading]  = useState<number | null>(null);
  const templateFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [participants, setParticipants] = useState<string[]>([]);
  const csvRef = useRef<HTMLInputElement>(null);

  const [prizes,   setPrizes]   = useState<EvPrize[]>([]);
  const [contents, setContents] = useState<EvContent[]>([]);

  /* Which content accordion is open + which template is previewed */
  const [openContent,      setOpenContent]      = useState<number | null>(0);
  const [previewTemplate,  setPreviewTemplate]  = useState<number>(0);
  const [previewSampleName, setPreviewSampleName] = useState('Participant Name');

  const [formError,   setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EvCertDoc | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  /* ── Load ───────────────────────────────────────────────────────── */
  const loadCerts = useCallback(() => {
    setListLoading(true); setListError('');
    fetch('/api/event-certificates')
      .then(r => r.json())
      .then(d => { if (d.success) setCerts(d.data); else setListError(d.message || 'Failed.'); })
      .catch(() => setListError('Network error.'))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    loadCerts();
    fetch('/api/programs')
      .then(r => r.json())
      .then(d => { if (d.success) setPrograms(d.programs); })
      .catch(() => {});
  }, [loadCerts]);

  /* ── Sync contents when templates change ────────────────────────── */
  const syncContents = useCallback((tmpls: EvTemplate[], prev: EvContent[]) =>
    tmpls.map((_, i) => prev.find(c => c.templateIndex === i) ?? defaultContent(i)),
  []);

  /* ── Template helpers ───────────────────────────────────────────── */
  const addTemplate = () => {
    const next: EvTemplate[] = [...templates, { label: `Template ${templates.length + 1}`, imageUrl: '', order: templates.length }];
    setTemplates(next);
    setContents(syncContents(next, contents));
    setOpenContent(next.length - 1);
    setPreviewTemplate(next.length - 1);
  };

  const removeTemplate = (i: number) => {
    const next = templates.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, order: idx }));
    setTemplates(next);
    setContents(syncContents(next, contents.filter(c => c.templateIndex !== i).map((c, idx) => ({ ...c, templateIndex: idx }))));
    setPrizes(p => p.filter(pr => pr.templateIndex !== i).map(pr => ({ ...pr, templateIndex: pr.templateIndex > i ? pr.templateIndex - 1 : pr.templateIndex })));
    setOpenContent(prev => (prev !== null && prev >= next.length ? Math.max(0, next.length - 1) : prev));
    setPreviewTemplate(prev => Math.min(prev, Math.max(0, next.length - 1)));
  };

  const uploadTemplateImage = async (i: number, file: File) => {
    setUploading(i);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res  = await fetch('/api/event-certificates/upload-template', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => prev.map((t, idx) => idx === i ? { ...t, imageUrl: data.url } : t));
        setFormError('');
      } else { setFormError(data.message || 'Upload failed.'); }
    } catch { setFormError('Upload failed — network error.'); }
    finally { setUploading(null); }
  };

  /* ── CSV ────────────────────────────────────────────────────────── */
  const handleCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text   = (e.target?.result as string) ?? '';
      const emails = text.split(/[\r\n,;]+/).map(s => s.trim().toLowerCase()).filter(s => s.includes('@'));
      setParticipants(emails); setFormError('');
    };
    reader.readAsText(file);
  };

  /* ── Prize helpers ──────────────────────────────────────────────── */
  const addPrize = () => {
    const idx = prizes.length;
    const ordinal = idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`;
    setPrizes([...prizes, { label: `${ordinal} Prize`, email: '', templateIndex: Math.min(1, templates.length - 1) }]);
  };

  /* ── Content field helper ───────────────────────────────────────── */
  const setContent = (i: number, patch: Partial<EvContent>) =>
    setContents(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  /* ── Reset ──────────────────────────────────────────────────────── */
  const resetForm = () => {
    setForm({ programId: '', programName: '' });
    setTemplates([]); setParticipants([]); setPrizes([]); setContents([]);
    setFormError(''); setFormSuccess(''); setEditId(null);
    setOpenContent(0); setPreviewTemplate(0);
  };

  /* ── Populate for edit ──────────────────────────────────────────── */
  const startEdit = (doc: EvCertDoc) => {
    setEditId(doc._id);
    setForm({ programId: doc.programId, programName: doc.programName });
    setTemplates(doc.templates);
    setParticipants(doc.participants);
    setPrizes(doc.prizes);
    setContents(doc.contents.length ? doc.contents : doc.templates.map((_, i) => defaultContent(i)));
    setFormError(''); setFormSuccess(''); setOpenContent(0); setPreviewTemplate(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Submit ─────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!form.programId)                             return setFormError('Please select a program.');
    if (templates.length === 0)                      return setFormError('Add at least one certificate template.');
    if (templates.some(t => !t.imageUrl))            return setFormError('Upload an image for every template.');
    if (templates.some(t => !t.label.trim()))        return setFormError('Every template must have a label.');
    if (prizes.some(p => !p.email.trim()))           return setFormError('Fill the email for every prize entry.');

    setSubmitting(true);
    try {
      const res  = await fetch('/api/event-certificates', {
        method:  editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId ?? undefined, ...form, templates, participants, prizes, contents }),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess(editId ? 'Certificate config updated!' : 'Certificate config created!');
        resetForm(); loadCerts();
        setTimeout(() => setFormSuccess(''), 3000);
      } else { setFormError(data.message || 'Failed.'); }
    } catch { setFormError('Network error.'); }
    finally { setSubmitting(false); }
  };

  /* ── Delete ─────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      const res  = await fetch('/api/event-certificates', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget._id }),
      });
      const data = await res.json();
      if (data.success) { setCerts(c => c.filter(x => x._id !== deleteTarget._id)); setDeleteTarget(null); }
      else setDeleteError(data.message || 'Failed.');
    } catch { setDeleteError('Network error.'); }
    finally { setDeleting(false); }
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Event Certificates</h1>
          <p className={styles.desc}>Configure certificate templates, participants, prizes and content positioning.</p>
        </div>
        <div className={styles.countBadge}>
          <Award size={14} />
          {listLoading ? '...' : `${certs.length} config${certs.length !== 1 ? 's' : ''}`}
        </div>
      </header>

      {/* Form Card */}
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
              id="ec-program" className={styles.select}
              value={form.programId}
              onChange={e => {
                const prog = programs.find(p => p._id === e.target.value);
                setForm({ programId: e.target.value, programName: prog?.name ?? '' });
                setFormError('');
              }}
            >
              <option value="">— Select a program —</option>
              {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
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
                    type="text" className={styles.input}
                    placeholder="Label (e.g. Participant, 1st Prize)"
                    value={tpl.label}
                    onChange={e => setTemplates(prev => prev.map((t, idx) => idx === i ? { ...t, label: e.target.value } : t))}
                  />
                  <div className={styles.tplUploadWrap}>
                    <button type="button" className={styles.uploadBtn}
                      onClick={() => templateFileRefs.current[i]?.click()}
                      disabled={uploading === i}
                    >
                      {uploading === i
                        ? <><Loader2 size={13} className={styles.spin} /> Uploading...</>
                        : <><Upload size={13} /> {tpl.imageUrl ? 'Replace Image' : 'Upload Background'}</>}
                    </button>
                    <input
                      ref={el => { templateFileRefs.current[i] = el; }}
                      type="file" accept="image/jpeg,image/png,image/webp"
                      className={styles.hiddenInput}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadTemplateImage(i, f); }}
                    />
                    {tpl.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={tpl.imageUrl} alt={tpl.label} className={styles.tplThumb} />
                    )}
                  </div>
                </div>
                <button type="button" className={styles.removeBtn} onClick={() => removeTemplate(i)} title="Remove template">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 3 — Participants CSV */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}><Users size={12} /> Participants Data (CSV of emails)</label>
              <button type="button" className={styles.addRowBtn} onClick={() => csvRef.current?.click()}>
                <Upload size={13} /> Upload CSV
              </button>
            </div>
            <input ref={csvRef} type="file" accept=".csv,text/csv,text/plain" className={styles.hiddenInput}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCsv(f); e.target.value = ''; }}
            />
            {participants.length > 0
              ? <p className={styles.csvInfo}><CheckCircle size={13} /> {participants.length} participant email{participants.length !== 1 ? 's' : ''} loaded</p>
              : <p className={styles.hint}>Upload a CSV with one email per line (or comma-separated).</p>}
          </div>

          {/* 4 — Prizes */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Prize Entries</label>
              <button type="button" className={styles.addRowBtn} onClick={addPrize} disabled={templates.length === 0}>
                <Plus size={13} /> Add Prize
              </button>
            </div>
            {prizes.length === 0
              ? <p className={styles.hint}>No prizes added. Click &ldquo;Add Prize&rdquo; to add prize winners.</p>
              : prizes.map((pr, i) => (
                <div key={i} className={styles.prizeRow}>
                  <input type="text" className={styles.input} placeholder="Label (e.g. 1st Prize)"
                    value={pr.label}
                    onChange={e => setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, label: e.target.value } : p))}
                  />
                  <input type="email" className={styles.input} placeholder="Winner email"
                    value={pr.email}
                    onChange={e => setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, email: e.target.value } : p))}
                  />
                  <select className={styles.select} value={pr.templateIndex}
                    onChange={e => setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, templateIndex: Number(e.target.value) } : p))}
                  >
                    {templates.map((t, ti) => (
                      <option key={ti} value={ti}>{t.label || `Template ${ti + 1}`}</option>
                    ))}
                  </select>
                  <button type="button" className={styles.removeBtn}
                    onClick={() => setPrizes(prev => prev.filter((_, idx) => idx !== i))}>
                    <X size={14} />
                  </button>
                </div>
              ))}
          </div>

          {/* 5 — Certificate Contents + Live Preview */}
          {templates.length > 0 && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Certificate Content &amp; Positioning</label>
              <p className={styles.hint}>
                Landscape 1123 x 794 px. Use X (horizontal) and Y (vertical) sliders to position each text element. The preview updates live.
              </p>

              {/* Preview sample name input */}
              <div className={styles.previewNameRow}>
                <label className={styles.labelSm}>Preview name</label>
                <input
                  type="text" className={styles.input}
                  placeholder="e.g. Arjun Kumar"
                  value={previewSampleName}
                  onChange={e => setPreviewSampleName(e.target.value)}
                  style={{ maxWidth: 240 }}
                />
                <label className={styles.labelSm}>Preview template</label>
                <select className={styles.select} style={{ maxWidth: 200 }}
                  value={previewTemplate}
                  onChange={e => { setPreviewTemplate(Number(e.target.value)); setOpenContent(Number(e.target.value)); }}
                >
                  {templates.map((t, ti) => (
                    <option key={ti} value={ti}>{t.label || `Template ${ti + 1}`}</option>
                  ))}
                </select>
              </div>

              {/* Split: accordion left + preview right */}
              <div className={styles.contentLayout}>

                {/* Left — accordions */}
                <div className={styles.contentAccordions}>
                  {contents.map((c, i) => (
                    <div key={i} className={styles.contentCard}>
                      <button
                        type="button"
                        className={styles.contentCardHeader}
                        onClick={() => { setOpenContent(openContent === i ? null : i); setPreviewTemplate(i); }}
                      >
                        <span className={styles.contentCardTitle}>
                          {templates[i]?.label || `Template ${i + 1}`}
                        </span>
                        {openContent === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {openContent === i && (
                        <div className={styles.contentCardBody}>

                          {/* ── TOP TEXT ── */}
                          <div className={styles.sectionDivider}>Top Content (above name)</div>
                          <textarea className={styles.textarea} rows={2}
                            placeholder="Text shown above the participant name..."
                            value={c.topText}
                            onChange={e => setContent(i, { topText: e.target.value })}
                          />
                          <div className={styles.positionGrid}>
                            {/* X */}
                            <div className={styles.sliderBlock}>
                              <div className={styles.sliderLabelRow}>
                                <span className={styles.labelSm}>X Position (horizontal)</span>
                                <span className={styles.sliderVal}>{c.topXPct}%</span>
                              </div>
                              <input type="range" min={0} max={100} step={1} className={styles.slider}
                                value={c.topXPct} onChange={e => setContent(i, { topXPct: Number(e.target.value) })} />
                            </div>
                            {/* Y */}
                            <div className={styles.sliderBlock}>
                              <div className={styles.sliderLabelRow}>
                                <span className={styles.labelSm}>Y Position (vertical)</span>
                                <span className={styles.sliderVal}>{c.topYPct}%</span>
                              </div>
                              <input type="range" min={0} max={100} step={1} className={styles.slider}
                                value={c.topYPct} onChange={e => setContent(i, { topYPct: Number(e.target.value) })} />
                            </div>
                            {/* Colour */}
                            <div className={styles.colorBlock}>
                              <span className={styles.labelSm}>Colour</span>
                              <input type="color" className={styles.colorInput} value={c.topColor}
                                onChange={e => setContent(i, { topColor: e.target.value })} />
                            </div>
                            {/* Font size */}
                            <div className={styles.sizeBlock}>
                              <span className={styles.labelSm}>Font (px)</span>
                              <input type="number" className={styles.input} min={8} max={120} value={c.topFontSize}
                                onChange={e => setContent(i, { topFontSize: Number(e.target.value) })} />
                            </div>
                          </div>

                          {/* ── NAME ── */}
                          <div className={styles.sectionDivider}>Name (auto-placed between top and body)</div>
                          <div className={styles.positionGrid}>
                            <div className={styles.sliderBlock}>
                              <div className={styles.sliderLabelRow}>
                                <span className={styles.labelSm}>X Position (horizontal)</span>
                                <span className={styles.sliderVal}>{c.nameXPct}%</span>
                              </div>
                              <input type="range" min={0} max={100} step={1} className={styles.slider}
                                value={c.nameXPct} onChange={e => setContent(i, { nameXPct: Number(e.target.value) })} />
                            </div>
                            <div className={styles.sliderBlock}>
                              <div className={styles.sliderLabelRow}>
                                <span className={styles.labelSm}>Y Position (vertical)</span>
                                <span className={styles.sliderVal}>{c.nameYPct}%</span>
                              </div>
                              <input type="range" min={0} max={100} step={1} className={styles.slider}
                                value={c.nameYPct} onChange={e => setContent(i, { nameYPct: Number(e.target.value) })} />
                            </div>
                            <div className={styles.colorBlock}>
                              <span className={styles.labelSm}>Colour</span>
                              <input type="color" className={styles.colorInput} value={c.nameColor}
                                onChange={e => setContent(i, { nameColor: e.target.value })} />
                            </div>
                            <div className={styles.sizeBlock}>
                              <span className={styles.labelSm}>Font (px)</span>
                              <input type="number" className={styles.input} min={8} max={120} value={c.nameFontSize}
                                onChange={e => setContent(i, { nameFontSize: Number(e.target.value) })} />
                            </div>
                          </div>

                          {/* ── BODY TEXT ── */}
                          <div className={styles.sectionDivider}>Body Content (below name)</div>
                          <textarea className={styles.textarea} rows={2}
                            placeholder="Text shown below the participant name..."
                            value={c.bodyText}
                            onChange={e => setContent(i, { bodyText: e.target.value })}
                          />
                          <div className={styles.positionGrid}>
                            <div className={styles.sliderBlock}>
                              <div className={styles.sliderLabelRow}>
                                <span className={styles.labelSm}>X Position (horizontal)</span>
                                <span className={styles.sliderVal}>{c.bodyXPct}%</span>
                              </div>
                              <input type="range" min={0} max={100} step={1} className={styles.slider}
                                value={c.bodyXPct} onChange={e => setContent(i, { bodyXPct: Number(e.target.value) })} />
                            </div>
                            <div className={styles.sliderBlock}>
                              <div className={styles.sliderLabelRow}>
                                <span className={styles.labelSm}>Y Position (vertical)</span>
                                <span className={styles.sliderVal}>{c.bodyYPct}%</span>
                              </div>
                              <input type="range" min={0} max={100} step={1} className={styles.slider}
                                value={c.bodyYPct} onChange={e => setContent(i, { bodyYPct: Number(e.target.value) })} />
                            </div>
                            <div className={styles.colorBlock}>
                              <span className={styles.labelSm}>Colour</span>
                              <input type="color" className={styles.colorInput} value={c.bodyColor}
                                onChange={e => setContent(i, { bodyColor: e.target.value })} />
                            </div>
                            <div className={styles.sizeBlock}>
                              <span className={styles.labelSm}>Font (px)</span>
                              <input type="number" className={styles.input} min={8} max={120} value={c.bodyFontSize}
                                onChange={e => setContent(i, { bodyFontSize: Number(e.target.value) })} />
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Right — live preview */}
                <div className={styles.previewPanel}>
                  <p className={styles.previewLabel}>Live Preview</p>
                  <div className={styles.previewWrap}>
                    {contents[previewTemplate] && (
                      <PreviewCanvas
                        imageUrl={templates[previewTemplate]?.imageUrl ?? ''}
                        content={contents[previewTemplate]}
                        sampleName={previewSampleName}
                      />
                    )}
                  </div>
                  <p className={styles.previewNote}>
                    Showing: {templates[previewTemplate]?.label || `Template ${previewTemplate + 1}`}
                    {' '}&mdash; QR placeholder shown in bottom-right corner.
                  </p>
                </div>

              </div>
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

      {/* Saved list */}
      {listLoading && <div className={styles.stateBox}><Loader2 size={26} className={styles.spin} /><span>Loading...</span></div>}
      {listError && !listLoading && <div className={`${styles.stateBox} ${styles.stateError}`}><AlertCircle size={20} /><span>{listError}</span></div>}
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
                  {doc.templates.map((t, ti) => <span key={ti} className={styles.tplChip}>{t.label}</span>)}
                </div>
              </div>
              <div className={styles.rowActions}>
                <button className={styles.editBtn} title="Edit" id={`edit-ec-${i}`} onClick={() => startEdit(doc)}><Pencil size={13} /></button>
                <button className={styles.deleteBtn} title="Delete" id={`delete-ec-${i}`}
                  onClick={() => { setDeleteTarget(doc); setDeleteError(''); }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={`${styles.modalIcon} ${styles.modalIconDanger}`}><Trash2 size={18} /></div>
              <div>
                <h2 className={styles.modalTitle}>Delete Certificate Config?</h2>
                <p className={styles.modalSub}>Config for &ldquo;<strong>{deleteTarget.programName}</strong>&rdquo; will be permanently removed.</p>
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
