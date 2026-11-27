'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';
import styles from './CompanyInternshipForm.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────
interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0-3
  timerSeconds: number; // 5-300, default 30
}

interface WeekData {
  deadlineDays: string;
  tutorialUrl: string;
  embedUrl: string;
  keyFeatures: string[];
  whatYouLearn: string;
  projectTitle: string;
  projectDescription: string;
  projectGuidance: string;
  quizQuestions: QuizQuestion[];
}

interface InitialWeek {
  week: number;
  deadlineDays: number;
  tutorialUrl: string;
  embedUrl?: string;
  keyFeatures: string[];
  whatYouLearn: string;
  projectTitle?: string;
  projectDescription?: string;
  projectGuidance?: string;
  quizQuestions?: QuizQuestion[];
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
  return { deadlineDays: '7', tutorialUrl: '', embedUrl: '', keyFeatures: ['', '', '', ''], whatYouLearn: '', projectTitle: '', projectDescription: '', projectGuidance: '', quizQuestions: [] };
}

function makeBlankQuestion(): QuizQuestion {
  return { question: '', options: ['', '', '', ''], correctIndex: 0, timerSeconds: 30 };
}

// ── cURL / plain-text bulk question parser ────────────────────────────────────
// Accepted format (blank line separates questions):
//
//   Q: What is the capital of France?
//   A: Berlin
//   B: Madrid
//   C: Paris
//   D: Rome
//   Correct: C
//   Timer: 30
//
// Lines are trimmed; "Q:" / "Question:" both accepted.
// "Correct:" accepts A/B/C/D (case-insensitive) or 0/1/2/3.
// "Timer:" is optional — defaults to 30.
function parseBulkQuestions(raw: string): { questions: QuizQuestion[]; errors: string[] } {
  const blocks = raw.trim().split(/\n\s*\n/).filter(b => b.trim());
  const questions: QuizQuestion[] = [];
  const errors: string[] = [];

  blocks.forEach((block, bi) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    let question = '';
    const options: [string, string, string, string] = ['', '', '', ''];
    let correctIndex = 0;
    let timerSeconds = 30;
    let hasCorrect = false;

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim().toUpperCase();
      const val = line.slice(colonIdx + 1).trim();

      if (key === 'Q' || key === 'QUESTION') {
        question = val;
      } else if (key === 'A') {
        options[0] = val;
      } else if (key === 'B') {
        options[1] = val;
      } else if (key === 'C') {
        options[2] = val;
      } else if (key === 'D') {
        options[3] = val;
      } else if (key === 'CORRECT' || key === 'ANSWER') {
        const v = val.toUpperCase();
        if      (v === 'A' || v === '0') { correctIndex = 0; hasCorrect = true; }
        else if (v === 'B' || v === '1') { correctIndex = 1; hasCorrect = true; }
        else if (v === 'C' || v === '2') { correctIndex = 2; hasCorrect = true; }
        else if (v === 'D' || v === '3') { correctIndex = 3; hasCorrect = true; }
        else { errors.push(`Q${bi + 1}: "Correct:" must be A, B, C, or D — got "${val}".`); }
      } else if (key === 'TIMER' || key === 'TIME') {
        const t = parseInt(val, 10);
        if (!isNaN(t) && t >= 5 && t <= 300) timerSeconds = t;
      }
    }

    if (!question) { errors.push(`Block ${bi + 1}: Missing "Q:" line.`); return; }
    if (options.some(o => !o)) { errors.push(`Q${bi + 1}: All four options A, B, C, D are required.`); return; }
    if (!hasCorrect) { errors.push(`Q${bi + 1}: Missing "Correct:" line.`); return; }

    questions.push({ question, options, correctIndex, timerSeconds });
  });

  return { questions, errors };
}

function weekFromInitial(w: InitialWeek): WeekData {
  return {
    deadlineDays: String(w.deadlineDays),
    tutorialUrl:  w.tutorialUrl,
    embedUrl:     w.embedUrl ?? '',
    keyFeatures:  w.keyFeatures.length >= 4 ? w.keyFeatures : [...w.keyFeatures, ...Array(4 - w.keyFeatures.length).fill('')],
    whatYouLearn: w.whatYouLearn,
    projectTitle: w.projectTitle ?? '',
    projectDescription: w.projectDescription ?? '',
    projectGuidance: w.projectGuidance ?? '',
    quizQuestions: w.quizQuestions ?? [],
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
  if (!week.projectTitle.trim())
    errs.projectTitle = `Project Title is required.`;
  if (!week.projectDescription.trim())
    errs.projectDescription = `What You Do on the Project is required.`;
  if (!week.projectGuidance.trim())
    errs.projectGuidance = `Project Guidance is required.`;
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

  // ── Bulk upload state ────────────────────────────────────────────────────
  const [showBulkModal,  setShowBulkModal]  = useState(false);
  const [bulkText,       setBulkText]       = useState('');
  const [bulkErrors,     setBulkErrors]     = useState<string[]>([]);
  const [bulkPreview,    setBulkPreview]    = useState<QuizQuestion[]>([]);

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
  const updateWeek = (field: keyof WeekData, value: string | string[] | QuizQuestion[] | number) => {
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

  // ── Quiz question helpers ──────────────────────────────────────────────────
  const addQuestion = () =>
    updateWeek('quizQuestions', [...currentWeek.quizQuestions, makeBlankQuestion()]);

  const removeQuestion = (qi: number) =>
    updateWeek('quizQuestions', currentWeek.quizQuestions.filter((_, i) => i !== qi));

  const updateQuestion = (qi: number, field: keyof QuizQuestion, value: string | number) => {
    const updated = currentWeek.quizQuestions.map((q, i) =>
      i === qi ? { ...q, [field]: value } : q
    );
    updateWeek('quizQuestions', updated);
  };

  const updateOption = (qi: number, optIdx: number, value: string) => {
    const updated = currentWeek.quizQuestions.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...q.options] as [string, string, string, string];
      opts[optIdx] = value;
      return { ...q, options: opts };
    });
    updateWeek('quizQuestions', updated);
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || /^\d+$/.test(raw)) updateWeek('deadlineDays', raw);
  };

  // ── Bulk upload handlers ──────────────────────────────────────────────────
  const handleBulkParse = () => {
    setBulkErrors([]);
    setBulkPreview([]);
    const { questions, errors: parseErrors } = parseBulkQuestions(bulkText);
    if (parseErrors.length > 0) {
      setBulkErrors(parseErrors);
      return;
    }
    if (questions.length === 0) {
      setBulkErrors(['No valid question blocks found. Check the format and try again.']);
      return;
    }
    setBulkPreview(questions);
  };

  const handleBulkConfirm = () => {
    // Append parsed questions to existing list
    updateWeek('quizQuestions', [...currentWeek.quizQuestions, ...bulkPreview]);
    setShowBulkModal(false);
    setBulkText('');
    setBulkErrors([]);
    setBulkPreview([]);
  };

  const handleBulkClose = () => {
    setShowBulkModal(false);
    setBulkText('');
    setBulkErrors([]);
    setBulkPreview([]);
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
          week:               i + 1,
          deadlineDays:       Number(w.deadlineDays),
          tutorialUrl:        w.tutorialUrl.trim(),
          embedUrl:           w.embedUrl.trim(),
          keyFeatures:        w.keyFeatures.map((f) => f.trim()),
          whatYouLearn:       w.whatYouLearn.trim(),
          projectTitle:       w.projectTitle.trim(),
          projectDescription: w.projectDescription.trim(),
          projectGuidance:    w.projectGuidance.trim(),
          quizQuestions:      w.quizQuestions.map(q => ({
            question:     q.question.trim(),
            options:      q.options.map(o => o.trim()) as [string, string, string, string],
            correctIndex: q.correctIndex,
          })),
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
            YouTube Link <span className={styles.required}>*</span>
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

        {/* Embed URL (optional) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`embed-${step}`}>
            YouTube Embedded Link <span className={styles.optionalBadge}>optional</span>
          </label>
          <input
            id={`embed-${step}`}
            type="url"
            className={styles.input}
            value={currentWeek.embedUrl}
            onChange={(e) => updateWeek('embedUrl', e.target.value)}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
          />
          <p className={styles.helperText}>
            If provided, this embed link will be prioritised in the user dashboard instead of the regular YouTube URL.
            Format: <code>https://www.youtube.com/embed/VIDEO_ID</code>
          </p>
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

        {/* Project Title */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`proj-title-${step}`}>
            Project Title <span className={styles.required}>*</span>
          </label>
          <input
            id={`proj-title-${step}`}
            type="text"
            className={`${styles.input} ${errors.projectTitle ? styles.inputError : ''}`}
            value={currentWeek.projectTitle}
            onChange={(e) => updateWeek('projectTitle', e.target.value)}
            placeholder="e.g. Library Management System"
          />
          {errors.projectTitle && <p className={styles.errorText}>{errors.projectTitle}</p>}
        </div>

        {/* What You Do on the Project */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`proj-desc-${step}`}>
            What You Do on the Project <span className={styles.required}>*</span>
          </label>
          <textarea
            id={`proj-desc-${step}`}
            className={`${styles.textarea} ${errors.projectDescription ? styles.inputError : ''}`}
            value={currentWeek.projectDescription}
            onChange={(e) => updateWeek('projectDescription', e.target.value)}
            placeholder="Describe what the student needs to build / do for this project…"
            rows={3}
          />
          {errors.projectDescription && <p className={styles.errorText}>{errors.projectDescription}</p>}
        </div>

        {/* Project Guidance */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`proj-guidance-${step}`}>
            Project Guidance <span className={styles.required}>*</span>
          </label>
          <textarea
            id={`proj-guidance-${step}`}
            className={`${styles.textarea} ${errors.projectGuidance ? styles.inputError : ''}`}
            value={currentWeek.projectGuidance}
            onChange={(e) => updateWeek('projectGuidance', e.target.value)}
            placeholder="Provide step-by-step guidance or hints to help the student complete the project…"
            rows={4}
          />
          {errors.projectGuidance && <p className={styles.errorText}>{errors.projectGuidance}</p>}
        </div>

        {/* ── Quiz Questions ── */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Quiz Questions <span className={styles.optionalBadge}>optional</span>
          </label>

          {currentWeek.quizQuestions.map((q, qi) => (
            <div key={qi} className={styles.quizCard}>
              {/* Question header */}
              <div className={styles.quizHeader}>
                <span className={styles.quizNum}>Q{qi + 1}</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeQuestion(qi)}
                  aria-label={`Remove question ${qi + 1}`}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Question text */}
              <textarea
                className={`${styles.textarea} ${errors[`q_${qi}_question`] ? styles.inputError : ''}`}
                value={q.question}
                onChange={e => updateQuestion(qi, 'question', e.target.value)}
                placeholder={`Question ${qi + 1}…`}
                id={`q-${step}-${qi}-text`}
                rows={2}
              />
              {errors[`q_${qi}_question`] && (
                <p className={styles.errorText}>{errors[`q_${qi}_question`]}</p>
              )}

              {/* Timer per question */}
              <div className={styles.fieldGroup} style={{ marginTop: 8 }}>
                <label className={styles.label} htmlFor={`q-${step}-${qi}-timer`}>
                  Time Limit (seconds) <span className={styles.optionalBadge}>shown to user during quiz</span>
                </label>
                <input
                  id={`q-${step}-${qi}-timer`}
                  type="number"
                  min={5}
                  max={300}
                  className={styles.input}
                  value={q.timerSeconds}
                  onChange={e => updateQuestion(qi, 'timerSeconds', Math.min(300, Math.max(5, Number(e.target.value) || 30)))}
                  style={{ maxWidth: 160 }}
                />
              </div>

              {/* Four options */}
              <div className={styles.quizOptions}>
                {(['A', 'B', 'C', 'D'] as const).map((letter, optIdx) => (
                  <div key={optIdx} className={styles.quizOptionRow}>
                    <label
                      className={`${styles.quizOptionLabel} ${q.correctIndex === optIdx ? styles.quizOptionCorrect : ''}`}
                      title="Mark as correct answer"
                    >
                      <input
                        type="radio"
                        name={`correct-${step}-${qi}`}
                        checked={q.correctIndex === optIdx}
                        onChange={() => updateQuestion(qi, 'correctIndex', optIdx)}
                        className={styles.quizRadio}
                      />
                      <span className={styles.quizOptionLetter}>{letter}</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.input} ${errors[`q_${qi}_opt_${optIdx}`] ? styles.inputError : ''}`}
                      value={q.options[optIdx]}
                      onChange={e => updateOption(qi, optIdx, e.target.value)}
                      placeholder={`Option ${letter}`}
                      id={`q-${step}-${qi}-opt-${optIdx}`}
                    />
                  </div>
                ))}
              </div>
              <p className={styles.helperText}>Select the radio button next to the correct answer.</p>
              {errors[`q_${qi}_options`] && (
                <p className={styles.errorText}>{errors[`q_${qi}_options`]}</p>
              )}
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addQuestion}>
            <Plus size={15} /> Add Question
          </button>
          <button type="button" className={styles.bulkUploadBtn} onClick={() => setShowBulkModal(true)}>
            <Upload size={15} /> Bulk Upload
          </button>
        </div>

        {/* ── Bulk Upload Modal ── */}
        {showBulkModal && (
          <div className={styles.bulkOverlay}>
            <div className={styles.bulkModal}>
              <div className={styles.bulkModalHeader}>
                <h3 className={styles.bulkModalTitle}>Bulk Upload Quiz Questions</h3>
                <button type="button" className={styles.removeBtn} onClick={handleBulkClose} aria-label="Close">
                  <X size={16} />
                </button>
              </div>

              {/* Format guide */}
              <div className={styles.bulkFormatGuide}>
                <p className={styles.bulkFormatTitle}>Paste questions in this format (blank line between questions):</p>
                <pre className={styles.bulkFormatExample}>{`Q: What is the capital of France?
A: Berlin
B: Madrid
C: Paris
D: Rome
Correct: C
Timer: 30

Q: Which data structure uses LIFO?
A: Queue
B: Stack
C: Array
D: Tree
Correct: B
Timer: 20`}</pre>
                <p className={styles.bulkFormatNote}>
                  Correct: accepts A / B / C / D &nbsp;|&nbsp; Timer: is optional (default 30 sec, max 300)
                </p>
              </div>

              {/* Textarea */}
              <textarea
                className={styles.bulkTextarea}
                value={bulkText}
                onChange={e => { setBulkText(e.target.value); setBulkErrors([]); setBulkPreview([]); }}
                placeholder="Paste your questions here…"
                rows={12}
                spellCheck={false}
              />

              {/* Parse errors */}
              {bulkErrors.length > 0 && (
                <div className={styles.bulkErrorBox}>
                  {bulkErrors.map((err, i) => (
                    <p key={i} className={styles.bulkErrorLine}>{err}</p>
                  ))}
                </div>
              )}

              {/* Preview — shown after successful parse */}
              {bulkPreview.length > 0 && (
                <div className={styles.bulkPreview}>
                  <p className={styles.bulkPreviewTitle}>
                    Preview — {bulkPreview.length} question{bulkPreview.length !== 1 ? 's' : ''} parsed successfully
                  </p>
                  {bulkPreview.map((q, qi) => (
                    <div key={qi} className={styles.bulkPreviewCard}>
                      <div className={styles.quizHeader}>
                        <span className={styles.quizNum}>Q{qi + 1}</span>
                        <span className={styles.bulkPreviewTimer}>Timer: {q.timerSeconds}s</span>
                      </div>
                      <p className={styles.bulkPreviewQuestion}>{q.question}</p>
                      <div className={styles.quizOptions}>
                        {(['A', 'B', 'C', 'D'] as const).map((letter, optIdx) => (
                          <div key={optIdx} className={styles.quizOptionRow}>
                            <span className={`${styles.quizOptionLabel} ${q.correctIndex === optIdx ? styles.quizOptionCorrect : ''}`}>
                              <span className={styles.quizOptionLetter}>{letter}</span>
                            </span>
                            <span className={`${styles.bulkPreviewOpt} ${q.correctIndex === optIdx ? styles.bulkPreviewOptCorrect : ''}`}>
                              {q.options[optIdx]}
                              {q.correctIndex === optIdx && <span className={styles.bulkCorrectTag}> (correct)</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className={styles.bulkActions}>
                {bulkPreview.length === 0 ? (
                  <button
                    type="button"
                    className={styles.nextBtn}
                    onClick={handleBulkParse}
                    disabled={!bulkText.trim()}
                  >
                    Parse and Preview
                  </button>
                ) : (
                  <>
                    <button type="button" className={styles.backBtn} onClick={() => setBulkPreview([])}>
                      Edit Text
                    </button>
                    <button type="button" className={styles.submitBtn} onClick={handleBulkConfirm}>
                      Add {bulkPreview.length} Question{bulkPreview.length !== 1 ? 's' : ''}
                    </button>
                  </>
                )}
                <button type="button" className={styles.backBtn} onClick={handleBulkClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
