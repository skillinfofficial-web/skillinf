'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, CheckCircle, GraduationCap, BookOpen, Send } from 'lucide-react';
import styles from './ApplyModal.module.css';

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */

export interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  itemType?: 'internship' | 'program';
  itemId?: string;
}

interface CourseOption {
  _id: string;
  name: string;
  type: 'internship' | 'program';
}

type Mode = 'certificate' | 'learn';
type Step = 'form' | 'paying' | 'paid' | 'done';

const CERT_AMOUNT  = 149;
const LEARN_AMOUNT = 499;

interface FormState {
  name: string;
  email: string;
  mobile: string;
  mode: Mode | '';
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormState = {
  name: '', email: '', mobile: '', mode: '', startDate: '', endDate: '',
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function loadCashfree(): Promise<void> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Cashfree) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function ApplyModal({
  isOpen,
  onClose,
  itemName: fixedName = '',
  itemType: fixedType,
  itemId:   fixedId   = '',
}: ApplyModalProps) {

  const needsPicker = !fixedName;

  /* Course picker */
  const [courses, setCourses]       = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [pickedId, setPickedId]     = useState('');
  const [pickErr, setPickErr]       = useState('');

  const picked = courses.find(c => c._id === pickedId);
  const effName = fixedName || picked?.name || '';
  const effType = fixedType || picked?.type || 'internship';
  const effId   = fixedId   || picked?._id  || '';

  /* Form */
  const [step, setStep]           = useState<Step>('form');
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormState, string>>>({});
  const [paymentId, setPaymentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving]         = useState(false);

  const amount = form.mode === 'certificate' ? CERT_AMOUNT
               : form.mode === 'learn'       ? LEARN_AMOUNT
               : 0;

  /* Fetch courses when picker is needed */
  useEffect(() => {
    if (!isOpen || !needsPicker) return;
    setLoadingCourses(true);
    Promise.all([
      fetch('/api/catalog/internship').then(r => r.json()),
      fetch('/api/catalog/program').then(r => r.json()),
    ])
      .then(([intern, prog]) => {
        const list: CourseOption[] = [
          ...(intern.success
            ? intern.items.map((i: CourseOption) => ({ ...i, type: 'internship' as const }))
            : []),
          ...(prog.success
            ? prog.items.map((p: CourseOption) => ({ ...p, type: 'program' as const }))
            : []),
        ];
        setCourses(list);
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, [isOpen, needsPicker]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* Escape to close */
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && step === 'form') onClose();
  }, [onClose, step]);
  useEffect(() => {
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onKey]);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setForm(EMPTY_FORM);
      setErrors({});
      setPaymentId('');
      setPickedId('');
      setPickErr('');
    }
  }, [isOpen]);

  /* ---------------------------------------------------------------- */
  /* Validation                                                         */
  /* ---------------------------------------------------------------- */

  function validate(): boolean {
    if (needsPicker && !pickedId) {
      setPickErr('Please select a course to continue');
      return false;
    }
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())
      errs.name = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'A valid email is required';
    if (!form.mobile.trim() || !/^\+?[\d\s-]{10,}$/.test(form.mobile.trim()))
      errs.mobile = 'A valid mobile number is required';
    if (!form.mode)
      errs.mode = 'Please select a mode';
    if (!form.startDate)
      errs.startDate = 'Start date is required';
    if (!form.endDate)
      errs.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      errs.endDate = 'End date must be after start date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ---------------------------------------------------------------- */
  /* Payment                                                            */
  /* ---------------------------------------------------------------- */

  async function handleProceed(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setProcessing(true);
    try {
      await loadCashfree();
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          itemName: effName,
          itemType: effType,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.mobile,
        }),
      });
      const { orderId, paymentSessionId, error: orderErr } = await res.json();
      if (orderErr) throw new Error(orderErr);

      setStep('paying');
      setProcessing(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cashfree = (window as any).Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox',
      });

      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      });

      if (result?.error) {
        console.error('Cashfree error:', result.error);
        setStep('form');
      } else if (result?.paymentDetails) {
        setPaymentId(orderId);
        setStep('paid');
      } else {
        // dismissed / cancelled
        setStep('form');
      }
    } catch {
      setStep('form');
    } finally {
      setProcessing(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Save to DB                                                         */
  /* ---------------------------------------------------------------- */

  async function handleFinalClick() {
    setSaving(true);
    try {
      await fetch('/api/payment/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          mode: form.mode,
          startDate: form.startDate,
          endDate: form.endDate,
          itemName: effName,
          itemType: effType,
          itemId: effId,
          amount,
          paymentId,
          createdAt: new Date().toISOString(),
        }),
      });
    } catch {
      /* proceed to done anyway */
    } finally {
      setSaving(false);
      setStep('done');
    }
  }

  /* ---------------------------------------------------------------- */
  /* Helpers                                                            */
  /* ---------------------------------------------------------------- */

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }));
  }

  function inputCls(key: keyof FormState) {
    return errors[key] ? `${styles.input} ${styles.hasError}` : styles.input;
  }
  function selectCls(key: keyof FormState) {
    return errors[key] ? `${styles.select} ${styles.hasError}` : styles.select;
  }

  if (!isOpen) return null;

  const internships = courses.filter(c => c.type === 'internship');
  const programs    = courses.filter(c => c.type === 'program');

  /* ================================================================ */
  /* Render                                                             */
  /* ================================================================ */

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget && step === 'form') onClose(); }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Apply Now">

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <p className={styles.headerLabel}>
              {effType === 'internship' ? 'Internship' : 'Program'}
            </p>
            <h2 className={styles.headerTitle}>Apply Now</h2>
          </div>
          {step === 'form' && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Course chip ── */}
        <div className={styles.itemChip}>
          {effName || 'Choose a course below'}
        </div>

        <div className={styles.body}>

          {/* ════ STEP: form ════ */}
          {step === 'form' && (
            <form onSubmit={handleProceed} noValidate>
              <div className={styles.fieldGroup}>

                {/* Course picker — only when no fixed item */}
                {needsPicker && (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="apply-course">
                      Select Course <span className={styles.req}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="apply-course"
                        className={pickErr ? `${styles.select} ${styles.hasError}` : styles.select}
                        value={pickedId}
                        disabled={loadingCourses}
                        onChange={e => { setPickedId(e.target.value); setPickErr(''); }}
                      >
                        <option value="">
                          {loadingCourses ? 'Loading courses...' : '-- Select an internship or program --'}
                        </option>
                        {internships.length > 0 && (
                          <optgroup label="Internships">
                            {internships.map(c => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </optgroup>
                        )}
                        {programs.length > 0 && (
                          <optgroup label="Programs">
                            {programs.map(c => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    {pickErr && <span className={styles.errMsg}>{pickErr}</span>}
                  </div>
                )}

                {/* Name + Email */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="apply-name">
                      Full Name <span className={styles.req}>*</span>
                    </label>
                    <input
                      id="apply-name" type="text"
                      className={inputCls('name')} placeholder="e.g. Arun Kumar"
                      value={form.name} onChange={e => setField('name', e.target.value)}
                    />
                    {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="apply-email">
                      Email Address <span className={styles.req}>*</span>
                    </label>
                    <input
                      id="apply-email" type="email"
                      className={inputCls('email')} placeholder="you@example.com"
                      value={form.email} onChange={e => setField('email', e.target.value)}
                    />
                    {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
                  </div>
                </div>

                {/* Mobile */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="apply-mobile">
                    Mobile Number <span className={styles.req}>*</span>
                  </label>
                  <input
                    id="apply-mobile" type="tel"
                    className={inputCls('mobile')} placeholder="+91 98765 43210"
                    value={form.mobile} onChange={e => setField('mobile', e.target.value)}
                  />
                  {errors.mobile && <span className={styles.errMsg}>{errors.mobile}</span>}
                </div>

                {/* Mode */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="apply-mode">
                    Enrollment Mode <span className={styles.req}>*</span>
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      id="apply-mode"
                      className={selectCls('mode')}
                      value={form.mode}
                      onChange={e => setField('mode', e.target.value as Mode | '')}
                    >
                      <option value="">Select a mode...</option>
                      <option value="certificate">Certificate Only -- Rs.{CERT_AMOUNT}</option>
                      <option value="learn">Learn + Certificate -- Rs.{LEARN_AMOUNT}</option>
                    </select>
                  </div>
                  {errors.mode && <span className={styles.errMsg}>{errors.mode}</span>}

                  {form.mode === 'learn' && (
                    <div className={styles.modeNote}>
                      <span className={styles.modeNoteIcon}>&#128221;</span>
                      <span className={styles.modeNoteText}>
                        <strong>Note:</strong> You will receive your certificate only after completing the
                        full course / internship / program within the selected period.
                        Keep learning and finish strong!
                      </span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="apply-start">
                      Start Date <span className={styles.req}>*</span>
                    </label>
                    <input
                      id="apply-start" type="date"
                      className={inputCls('startDate')} min={todayStr()}
                      value={form.startDate} onChange={e => setField('startDate', e.target.value)}
                    />
                    {errors.startDate && <span className={styles.errMsg}>{errors.startDate}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="apply-end">
                      End Date <span className={styles.req}>*</span>
                    </label>
                    <input
                      id="apply-end" type="date"
                      className={inputCls('endDate')} min={form.startDate || todayStr()}
                      value={form.endDate} onChange={e => setField('endDate', e.target.value)}
                    />
                    {errors.endDate && <span className={styles.errMsg}>{errors.endDate}</span>}
                  </div>
                </div>
              </div>

              {/* Amount box */}
              {form.mode && (
                <div className={styles.amountBox}>
                  <span className={styles.amountLabel}>Total Amount</span>
                  <span className={styles.amountValue}>Rs. {amount}</span>
                </div>
              )}

              <button
                type="submit" className={styles.submitBtn}
                id="apply-proceed-btn" disabled={processing}
              >
                {processing ? (
                  <>
                    <div className={styles.spinner} style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Processing...
                  </>
                ) : (
                  <><CreditCard size={18} /> Proceed to Payment</>
                )}
              </button>
            </form>
          )}

          {/* ════ STEP: paying ════ */}
          {step === 'paying' && (
            <div className={styles.payingState}>
              <div className={styles.spinner} />
              <p>Opening Razorpay payment gateway...<br />Please complete the payment in the popup.</p>
            </div>
          )}

          {/* ════ STEP: paid ════ */}
          {step === 'paid' && (
            <div className={styles.successState}>
              <div className={styles.successIconWrap}>
                <CreditCard size={30} />
              </div>
              <h3 className={styles.successTitle}>Payment Successful!</h3>
              <p className={styles.successSubtitle}>
                Your payment of <strong>Rs. {amount}</strong> has been received.
                Click below to complete your enrollment.
              </p>
              {paymentId && (
                <span className={styles.paymentRef}>Payment ID: {paymentId}</span>
              )}
              <button
                className={styles.finalBtn} id="apply-final-btn"
                onClick={handleFinalClick} disabled={saving}
              >
                {saving ? (
                  <>
                    <div className={styles.spinner} style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Saving...
                  </>
                ) : form.mode === 'certificate' ? (
                  <><GraduationCap size={18} /> Get Certificate</>
                ) : (
                  <><BookOpen size={18} /> Learn + Get Certificate</>
                )}
              </button>
            </div>
          )}

          {/* ════ STEP: done ════ */}
          {step === 'done' && (
            <div className={styles.doneState}>
              <div className={styles.doneIconWrap}>
                <CheckCircle size={34} />
              </div>
              <h3 className={styles.doneTitle}>
                {form.mode === 'certificate' ? "You're Enrolled!" : "Welcome to the Program!"}
              </h3>
              <p className={styles.doneMsg}>
                Hi <span className={styles.doneHighlight}>{form.name}</span>, your enrollment
                for <span className={styles.doneHighlight}>{effName}</span> has been confirmed.
                Our team will reach out to you at{' '}
                <span className={styles.doneHighlight}>{form.email}</span> within{' '}
                <span className={styles.doneHighlight}>24 hours</span> with the next steps.
                Keep an eye on your inbox!
              </p>
              <button className={styles.closeModalBtn} onClick={onClose} id="apply-done-close">
                <Send size={14} style={{ display: 'inline', marginRight: 6 }} />
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
