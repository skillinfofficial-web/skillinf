'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import styles from './CompanyInternshipForm.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WeekData {
  deadlineDays: string;
  tutorialUrl: string;
  keyFeatures: string[];
  whatYouLearn: string;
}

interface InitialWeek {
  week: number;
  deadlineDays: number;
  tutorialUrl: string;
  keyFeatures: string[];
  whatYouLearn: string;
}

interface Props {
  editMode?:    boolean;
  editId?:      string;
  initialName?: string;
  initialWeeks?: InitialWeek[];
}

const WEEK_SUBTITLES = [
  'Build the foundation',
  'Expand your skills',
  'Apply what you know',
  'Complete your journey',
];

const YOUTUBE_REGEX =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)[\w-]{11}|youtu\.be\/[\w-]{11})(?:[?&].*)?$/;

function makeBlankWeek(): WeekData {
  return { deadlineDays: '7', tutorialUrl: '', keyFeatures: ['', '', '', ''], whatYouLearn: '' };
}

function weekFromInitial(w: InitialWeek): WeekData {
  return {
    deadlineDays: String(w.deadlineDays),
    tutorialUrl:  w.tutorialUrl,
    keyFeatures:  w.keyFeatures.length >= 4 ? w.keyFeatures : [...w.keyFeatures, ...Array(4 - w.keyFeatures.length).fill('')],
    whatYouLearn: w.whatYouLearn,
  };
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  return (
    <div className={styles.stepper}>
      {[1, 2, 3, 4].map((n) => {
        const done   = n < current;
        const active = n === current;
        return (
          <div key={n} className={`${styles.stepItem} ${done ? styles.completed : ''} ${active ? styles.active : ''}`}>
            <div className={styles.stepCircle}>
              {done ? <CheckCircle size={16} /> : n}
            </div>
            <span className={styles.stepLabel}>Week {n}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Per-step validation ───────────────────────────────────────────────────────
function validateStep(week: WeekData, weekNum: number): Record<string, string> {
  const errs: Record<string, string> = {};
  const days = Number(week.deadlineDays);
  if (!week.deadlineDays || !Number.isInteger(days) || days < 1)
    errs.deadlineDays = `Enter a positive whole number (e.g. 7).`;
  if (!week.tutorialUrl.trim() || !YOUTUBE_REGEX.test(week.tutorialUrl.trim()))
    errs.tutorialUrl = `Enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...).`;
  week.keyFeatures.forEach((f, i) => {
    if (!f.trim()) errs[`feature_${i}`] = `Feature ${i + 1} is required.`;
  });
  if (week.keyFeatures.length < 4)
    errs.keyFeatures = `At least 4 key features are required.`;
  if (!week.whatYouLearn.trim())
    errs.whatYouLearn = `What You Learn is required.`;
  else if (week.whatYouLearn.length > 250)
    errs.whatYouLearn = `Must be 250 characters or fewer.`;
  void weekNum;
  return errs;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CompanyInternshipForm({ editMode = false, editId, initialName = '', initialWeeks }: Props) {
  const router = useRouter();
  const [step,           setStep]           = useState(1);
  const [internshipName, setInternshipName] = useState(initialName);
  const [nameError,      setNameError]      = useState('');
  const [weeks,          setWeeks]          = useState<WeekData[]>(() =>
    initialWeeks ? initialWeeks.map(weekFromInitial) : [makeBlankWeek(), makeBlankWeek(), makeBlankWeek(), makeBlankWeek()]
  );
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [submitStatus,   setSubmitStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMsg,      setSubmitMsg]      = useState('');

  // ── Domains ──────────────────────────────────────────────────────────────
  const [domains,        setDomains]        = useState<string[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domainsError,   setDomainsError]   = useState('');

  useEffect(() => {
    fetch('/api/domains')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          // API returns objects { name } — extract to string[]
          const names = (d.domains as ({ name: string } | string)[]).map((x) =>
            typeof x === 'string' ? x : x.name
          );
          setDomains(names);
        } else {
          setDomainsError('Failed to load domains.');
        }
      })
      .catch(() => setDomainsError('Network error loading domains.'))
      .finally(() => setDomainsLoading(false));
  }, []);

  const currentWeek = weeks[step - 1];

  // ── Week state helpers ──────────────────────────────────────────────────
  const updateWeek = (field: keyof WeekData, value: string | string[]) => {
    setWeeks((prev) => {
      const next = [...prev];
      next[step - 1] = { ...next[step - 1], [field]: value };
      return next;
    });
  };

  const updateFeature = (idx: number, value: string) => {
    const updated = [...currentWeek.keyFeatures];
    updated[idx]  = value;
    updateWeek('keyFeatures', updated);
  };

  const addFeature    = () => updateWeek('keyFeatures', [...currentWeek.keyFeatures, '']);
  const removeFeature = (idx: number) => {
    if (idx < 4) return;
    updateWeek('keyFeatures', currentWeek.keyFeatures.filter((_, i) => i !== idx));
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || /^\d+$/.test(raw)) updateWeek('deadlineDays', raw);
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 1 && !internshipName.trim()) { setNameError('Please select an internship domain.'); return; }
    setNameError('');
    const errs = validateStep(currentWeek, step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => { setErrors({}); setStep((s) => Math.max(s - 1, 1)); };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validateStep(currentWeek, step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitStatus('loading');

    try {
      const payload = {
        name: internshipName.trim(),
        weeks: weeks.map((w, i) => ({
          week:         i + 1,
          deadlineDays: Number(w.deadlineDays),
          tutorialUrl:  w.tutorialUrl.trim(),
          keyFeatures:  w.keyFeatures.map((f) => f.trim()),
          whatYouLearn: w.whatYouLearn.trim(),
        })),
      };

      const url    = editMode ? `/api/company-internships/${editId}` : '/api/company-internships';
      const method = editMode ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();

      if (data.success) {
        setSubmitStatus('success');
        setSubmitMsg(editMode ? 'Internship updated successfully!' : 'Company internship created successfully!');
        setTimeout(() => router.push('/admin/company-internships'), 1500);
      } else {
        setSubmitStatus('error');
        setSubmitMsg(data.message || 'Something went wrong.');
      }
    } catch {
      setSubmitStatus('error');
      setSubmitMsg('Network error. Please try again.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Status banners */}
      {submitStatus === 'success' && (
        <div className={`${styles.banner} ${styles.bannerSuccess}`}>
          <CheckCircle size={18} /> {submitMsg}
        </div>
      )}
      {submitStatus === 'error' && (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          <AlertCircle size={18} /> {submitMsg}
        </div>
      )}

      {/* ── Domain / Internship Name ── */}
      <div className={styles.nameCard}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Internship Domain <span className={styles.required}>*</span>
          </label>

          {domainsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary-text)', fontSize: '0.875rem', padding: '10px 0' }}>
              <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading domains…
            </div>
          ) : domainsError ? (
            <p className={styles.errorText}>{domainsError}</p>
          ) : domains.length === 0 ? (
            <p className={styles.helperText}>
              No domains found. Go to Company Internships and click <strong>+ Add Domain</strong> first.
            </p>
          ) : (
            <select
              id="internship-name"
              className={`${styles.input} ${nameError ? styles.inputError : ''}`}
              value={internshipName}
              onChange={(e) => { setInternshipName(e.target.value); setNameError(''); }}
              disabled={editMode && step > 1}
            >
              <option value="">— Select a domain —</option>
              {domains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          {nameError && <p className={styles.errorText}>{nameError}</p>}
          {editMode && step > 1 && (
            <p className={styles.helperText}>Domain is locked after Step 1. Go back to change it.</p>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <Stepper current={step} />

      {/* Week Card */}
      <div className={styles.weekCard}>
        <h2 className={styles.weekTitle}>Week {step}</h2>
        <p className={styles.weekSubtitle}>{WEEK_SUBTITLES[step - 1]}</p>

        {/* Deadline Days */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`deadline-${step}`}>
            Deadline Days <span className={styles.required}>*</span>
          </label>
          <input
            id={`deadline-${step}`}
            type="text"
            inputMode="numeric"
            className={`${styles.input} ${styles.inputNarrow} ${errors.deadlineDays ? styles.inputError : ''}`}
            value={currentWeek.deadlineDays}
            onChange={handleDeadlineChange}
            placeholder="7"
          />
          {errors.deadlineDays && <p className={styles.errorText}>{errors.deadlineDays}</p>}
        </div>

        {/* Tutorial URL */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`tutorial-${step}`}>
            What You Do <span className={styles.required}>*</span>
          </label>
          <input
            id={`tutorial-${step}`}
            type="url"
            className={`${styles.input} ${errors.tutorialUrl ? styles.inputError : ''}`}
            value={currentWeek.tutorialUrl}
            onChange={(e) => updateWeek('tutorialUrl', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className={styles.helperText}>YouTube tutorial URL (supports watch, shorts, and youtu.be links).</p>
          {errors.tutorialUrl && <p className={styles.errorText}>{errors.tutorialUrl}</p>}
        </div>

        {/* Key Features */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Key Features <span className={styles.required}>*</span></label>
          <div className={styles.featureList}>
            {currentWeek.keyFeatures.map((feat, idx) => {
              const locked = idx < 4;
              return (
                <div key={idx} className={styles.featureRow}>
                  <span className={styles.featureNum}>{idx + 1}.</span>
                  <input
                    type="text"
                    className={`${styles.input} ${errors[`feature_${idx}`] ? styles.inputError : ''}`}
                    value={feat}
                    onChange={(e) => updateFeature(idx, e.target.value)}
                    placeholder="Enter key feature"
                    id={`feature-${step}-${idx}`}
                  />
                  {!locked && (
                    <button type="button" className={styles.removeBtn} onClick={() => removeFeature(idx)} aria-label={`Remove feature ${idx + 1}`}>
                      <X size={14} />
                    </button>
                  )}
                  {locked && <span style={{ width: 32, flexShrink: 0 }} />}
                </div>
              );
            })}
            {currentWeek.keyFeatures.slice(0, 4).map((_, i) =>
              errors[`feature_${i}`] ? (
                <p key={`err-f-${i}`} className={styles.errorText} style={{ paddingLeft: 32 }}>
                  {errors[`feature_${i}`]}
                </p>
              ) : null
            )}
          </div>
          <button type="button" className={styles.addBtn} onClick={addFeature}>
            <Plus size={15} /> Add Feature
          </button>
          {errors.keyFeatures && <p className={styles.errorText}>{errors.keyFeatures}</p>}
        </div>

        {/* What You Learn */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`learn-${step}`}>
            What You Learn <span className={styles.required}>*</span>
          </label>
          <textarea
            id={`learn-${step}`}
            className={`${styles.textarea} ${errors.whatYouLearn ? styles.inputError : ''}`}
            value={currentWeek.whatYouLearn}
            onChange={(e) => updateWeek('whatYouLearn', e.target.value.slice(0, 250))}
            placeholder="Describe what the student will learn this week…"
            rows={3}
            maxLength={250}
          />
          <div className={`${styles.charCount} ${currentWeek.whatYouLearn.length >= 230 ? styles.charWarn : ''}`}>
            {currentWeek.whatYouLearn.length} / 250
          </div>
          {errors.whatYouLearn && <p className={styles.errorText}>{errors.whatYouLearn}</p>}
        </div>

        {/* Navigation */}
        <div className={`${styles.navRow} ${step === 1 ? styles.navRowEnd : ''}`}>
          {step > 1 && (
            <button type="button" className={styles.backBtn} onClick={handleBack}>← Back</button>
          )}
          {step < 4 ? (
            <button type="button" className={styles.nextBtn} onClick={handleNext}>Next →</button>
          ) : (
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={submitStatus === 'loading'}
            >
              {submitStatus === 'loading' ? 'Saving…' : editMode ? 'Update Internship' : 'Create Internship'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
