'use client';

import React, { useEffect, useState } from 'react';
import {
  Briefcase, Plus, Pencil, Trash2, Loader2, AlertCircle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, MapPin,
  Clock, DollarSign, Mail, Building2, ToggleLeft, ToggleRight, X,
} from 'lucide-react';
import styles from './CareersPage.module.css';

/* ── Types ─────────────────────────────────────────────────── */
interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  niceToHave: string;
  benefits: string;
  applyEmail: string;
  status: 'open' | 'closed';
  createdAt: string;
  createdAtIST: string;
}

const EMPTY_FORM = {
  title: '', department: '', location: 'Remote', type: 'Full-time',
  experience: '', salary: '', description: '', responsibilities: '',
  requirements: '', niceToHave: '', benefits: '', applyEmail: '', status: 'open',
};

const JOB_TYPES   = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance', 'Content', 'Other'];

export default function CareersPage() {
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  /* form */
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');
  const [formOk,     setFormOk]     = useState('');

  /* expanded card */
  const [expanded, setExpanded] = useState<string | null>(null);

  /* delete confirm */
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  /* toast */
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const load = () => {
    setLoading(true); setError('');
    fetch('/api/careers')
      .then(r => r.json())
      .then(d => { if (d.success) setJobs(d.jobs); else setError(d.message); })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  /* ── Form helpers ── */
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFormError(''); setFormOk('');
  };

  const openCreate = () => {
    setEditId(null); setForm({ ...EMPTY_FORM });
    setFormError(''); setFormOk('');
    setShowForm(true);
  };

  const openEdit = (job: Job) => {
    setEditId(job._id);
    setForm({
      title: job.title, department: job.department, location: job.location,
      type: job.type, experience: job.experience, salary: job.salary,
      description: job.description, responsibilities: job.responsibilities,
      requirements: job.requirements, niceToHave: job.niceToHave,
      benefits: job.benefits, applyEmail: job.applyEmail, status: job.status,
    });
    setFormError(''); setFormOk('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.department.trim() || !form.description.trim() || !form.applyEmail.trim()) {
      setFormError('Title, Department, Description and Apply Email are required.'); return;
    }
    setSaving(true); setFormError(''); setFormOk('');
    try {
      const method  = editId ? 'PATCH' : 'POST';
      const payload = editId ? { id: editId, ...form } : form;
      const res  = await fetch('/api/careers', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.message); return; }
      setFormOk(data.message);
      load();
      setTimeout(() => { closeForm(); showToast(data.message); }, 800);
    } catch { setFormError('Network error. Try again.'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (job: Job) => {
    const next = job.status === 'open' ? 'closed' : 'open';
    const res  = await fetch('/api/careers', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job._id, status: next }),
    });
    const data = await res.json();
    if (data.success) { load(); showToast(`Marked as ${next}.`); }
    else showToast(data.message, false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res  = await fetch('/api/careers', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteId }),
    });
    const data = await res.json();
    setDeleting(false); setDeleteId(null);
    if (data.success) { load(); showToast('Job deleted.'); }
    else showToast(data.message, false);
  };

  const openJobs   = jobs.filter(j => j.status === 'open');
  const closedJobs = jobs.filter(j => j.status === 'closed');

  /* ── Field component ── */
  const Field = ({
    label, id, required = false, children,
  }: { label: string; id: string; required?: boolean; children: React.ReactNode }) => (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}{required && <span className={styles.req}>*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className={styles.page}>

      {/* ── Toast ── */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteId && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className={styles.deleteModal}>
            <div className={styles.deleteIcon}><Trash2 size={22} /></div>
            <p className={styles.deleteTitle}>Delete Job Posting?</p>
            <p className={styles.deleteSub}>This action cannot be undone.</p>
            <div className={styles.deleteActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}><Briefcase size={20} /> Careers</h1>
          <p className={styles.desc}>Create and manage job postings shown on the Careers page.</p>
        </div>
        <button id="add-job-btn" className={styles.addBtn} onClick={showForm ? closeForm : openCreate}>
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Job</>}
        </button>
      </header>

      {/* ════════════════ JOB FORM ════════════════ */}
      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formHeader}>
            <Briefcase size={18} />
            <span>{editId ? 'Edit Job Posting' : 'New Job Posting'}</span>
          </div>

          {/* Row 1 — Title + Department */}
          <div className={styles.row2}>
            <Field label="Job Title" id="f-title" required>
              <input id="f-title" className={styles.input} placeholder="e.g. Full Stack Developer"
                value={form.title} onChange={set('title')} />
            </Field>
            <Field label="Department" id="f-dept" required>
              <select id="f-dept" className={styles.select} value={form.department} onChange={set('department')}>
                <option value="">— Select —</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          {/* Row 2 — Location + Type + Experience + Salary */}
          <div className={styles.row4}>
            <Field label="Location" id="f-loc">
              <input id="f-loc" className={styles.input} placeholder="Remote / City"
                value={form.location} onChange={set('location')} />
            </Field>
            <Field label="Job Type" id="f-type">
              <select id="f-type" className={styles.select} value={form.type} onChange={set('type')}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Experience" id="f-exp">
              <input id="f-exp" className={styles.input} placeholder="e.g. 1-3 years"
                value={form.experience} onChange={set('experience')} />
            </Field>
            <Field label="Salary / Stipend" id="f-sal">
              <input id="f-sal" className={styles.input} placeholder="e.g. ₹5-8 LPA"
                value={form.salary} onChange={set('salary')} />
            </Field>
          </div>

          {/* Description */}
          <Field label="Job Description" id="f-desc" required>
            <textarea id="f-desc" className={styles.textarea} rows={4}
              placeholder="Describe the role, what you'll be doing, team context…"
              value={form.description} onChange={set('description')} />
          </Field>

          {/* Responsibilities */}
          <Field label="Responsibilities" id="f-resp">
            <textarea id="f-resp" className={styles.textarea} rows={4}
              placeholder="• Lead frontend development&#10;• Collaborate with design team&#10;• Code reviews…"
              value={form.responsibilities} onChange={set('responsibilities')} />
          </Field>

          {/* Requirements */}
          <Field label="Requirements" id="f-req">
            <textarea id="f-req" className={styles.textarea} rows={4}
              placeholder="• Proficient in React & Next.js&#10;• 2+ years experience&#10;• Strong communication…"
              value={form.requirements} onChange={set('requirements')} />
          </Field>

          {/* Nice to Have */}
          <Field label="Nice to Have (Optional)" id="f-nth">
            <textarea id="f-nth" className={styles.textarea} rows={3}
              placeholder="• Experience with TypeScript&#10;• Open source contributions…"
              value={form.niceToHave} onChange={set('niceToHave')} />
          </Field>

          {/* Benefits */}
          <Field label="Benefits / Perks (Optional)" id="f-ben">
            <textarea id="f-ben" className={styles.textarea} rows={3}
              placeholder="• Remote-first work&#10;• Flexible hours&#10;• Certificate of completion…"
              value={form.benefits} onChange={set('benefits')} />
          </Field>

          {/* Row — Apply Email + Status */}
          <div className={styles.row2}>
            <Field label="Apply Email" id="f-email" required>
              <input id="f-email" type="email" className={styles.input} placeholder="careers@skillinf.in"
                value={form.applyEmail} onChange={set('applyEmail')} />
            </Field>
            <Field label="Status" id="f-status">
              <select id="f-status" className={styles.select} value={form.status} onChange={set('status')}>
                <option value="open">Open — Accepting Applications</option>
                <option value="closed">Closed — Not Hiring</option>
              </select>
            </Field>
          </div>

          {formError && <p className={styles.formErr}><AlertCircle size={14} /> {formError}</p>}
          {formOk    && <p className={styles.formOk}><CheckCircle2 size={14} /> {formOk}</p>}

          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={closeForm} disabled={saving}>Cancel</button>
            <button id="save-job-btn" type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? <><Loader2 size={15} className={styles.spin} /> Saving…</> : <><CheckCircle2 size={15} /> {editId ? 'Update Job' : 'Post Job'}</>}
            </button>
          </div>
        </form>
      )}

      {/* ════════════════ JOB LIST ════════════════ */}
      {loading && (
        <div className={styles.stateBox}><Loader2 size={28} className={styles.spin} /><p>Loading…</p></div>
      )}
      {error && !loading && (
        <div className={`${styles.stateBox} ${styles.errorBox}`}><AlertCircle size={24} /><p>{error}</p></div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className={styles.stateBox}>
          <Briefcase size={42} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No job postings yet</p>
          <p className={styles.emptyHint}>Click "Add Job" to create your first posting.</p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <div className={styles.counts}>
            <span className={`${styles.pill} ${styles.pillOpen}`}>{openJobs.length} Open</span>
            <span className={`${styles.pill} ${styles.pillClosed}`}>{closedJobs.length} Closed</span>
            <span className={styles.pill}>{jobs.length} Total</span>
          </div>

          <div className={styles.jobList}>
            {jobs.map(job => {
              const isOpen = expanded === job._id;
              return (
                <div key={job._id} className={`${styles.jobCard} ${job.status === 'closed' ? styles.jobClosed : ''}`}>

                  {/* Card header */}
                  <div className={styles.cardHead} onClick={() => setExpanded(isOpen ? null : job._id)}>
                    <div className={styles.cardLeft}>
                      <div className={styles.cardAvatar}>
                        <Briefcase size={16} />
                      </div>
                      <div>
                        <div className={styles.cardTitle}>{job.title}</div>
                        <div className={styles.cardMeta}>
                          <span><Building2 size={11} /> {job.department}</span>
                          <span className={styles.dot}>·</span>
                          <span><MapPin size={11} /> {job.location}</span>
                          <span className={styles.dot}>·</span>
                          <span><Clock size={11} /> {job.type}</span>
                          {job.salary && <><span className={styles.dot}>·</span><span><DollarSign size={11} /> {job.salary}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <span className={`${styles.statusBadge} ${job.status === 'open' ? styles.badgeOpen : styles.badgeClosed}`}>
                        {job.status === 'open' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {job.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                      {isOpen ? <ChevronUp size={16} className={styles.chevron} /> : <ChevronDown size={16} className={styles.chevron} />}
                    </div>
                  </div>

                  {/* Card body */}
                  {isOpen && (
                    <div className={styles.cardBody}>
                      {job.experience && <div className={styles.metaRow}><strong>Experience:</strong> {job.experience}</div>}
                      {job.applyEmail && <div className={styles.metaRow}><Mail size={13} /> <strong>Apply to:</strong> {job.applyEmail}</div>}

                      <Section title="Description"       text={job.description} />
                      <Section title="Responsibilities"  text={job.responsibilities} />
                      <Section title="Requirements"      text={job.requirements} />
                      <Section title="Nice to Have"      text={job.niceToHave} />
                      <Section title="Benefits / Perks"  text={job.benefits} />

                      <div className={styles.cardDate}>Posted: {job.createdAtIST || new Date(job.createdAt).toLocaleDateString('en-IN')}</div>

                      <div className={styles.cardActions}>
                        <button
                          className={`${styles.actionBtn} ${job.status === 'open' ? styles.actionClose : styles.actionOpen}`}
                          onClick={() => toggleStatus(job)}
                        >
                          {job.status === 'open'
                            ? <><ToggleLeft size={14} /> Mark Closed</>
                            : <><ToggleRight size={14} /> Reopen</>}
                        </button>
                        <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => openEdit(job)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => setDeleteId(job._id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  if (!text?.trim()) return null;
  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{title}</p>
      <div className={styles.sectionText}>
        {text.split('\n').map((line, i) => (
          <p key={i} style={{ margin: '0 0 4px' }}>{line}</p>
        ))}
      </div>
    </div>
  );
}
