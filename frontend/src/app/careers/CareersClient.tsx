'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import {
  Briefcase, MapPin, Clock, DollarSign, Building2,
  ChevronDown, ChevronUp, Instagram, Linkedin, Twitter,
  Send, Loader2, CheckCircle, AlertCircle, X, User,
  Mail, Phone, FileText, Link2, Star, ArrowRight,
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
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', experience: '',
  currentRole: '', portfolio: '', resumeLink: '', coverLetter: '',
};

export default function CareersClient() {
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  /* Apply modal */
  const [applyJob,    setApplyJob]    = useState<Job | null>(null);
  const [form,        setForm]        = useState({ ...EMPTY_FORM });
  const [submitting,  setSubmitting]  = useState(false);
  const [submitMsg,   setSubmitMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/careers')
      .then(r => r.json())
      .then(d => { if (d.success) setJobs(d.jobs); else setError(d.message); })
      .catch(() => setError('Failed to load jobs.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const openApply = (job: Job) => {
    setApplyJob(job); setForm({ ...EMPTY_FORM }); setSubmitMsg(null);
    document.body.style.overflow = 'hidden';
  };
  const closeApply = () => {
    setApplyJob(null); document.body.style.overflow = '';
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setSubmitMsg({ ok: false, text: 'Name and email are required.' }); return;
    }
    setSubmitting(true); setSubmitMsg(null);
    try {
      const res  = await fetch('/api/careers/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: applyJob!._id, jobTitle: applyJob!.title, ...form }),
      });
      const data = await res.json();
      setSubmitMsg({ ok: data.success, text: data.message });
      if (data.success) setTimeout(closeApply, 2800);
    } catch {
      setSubmitMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally { setSubmitting(false); }
  };

  const isEmpty = !loading && !error && jobs.length === 0;

  return (
    <>
      <Navbar />
      <main className={styles.main}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroBadge}>
              <span className={styles.heroDot} />
              We&apos;re Hiring
            </div>
            <h1 className={styles.heroTitle}>
              Join the <span className={styles.heroHighlight}>Skillinf</span> Team
            </h1>
            <p className={styles.heroSub}>
              We build premium digital products and grow careers. If you love what you do
              and want to work with a passionate team — you&apos;re in the right place.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}><span className={styles.heroStatN}>{jobs.length}</span><span>Open Roles</span></div>
              <div className={styles.heroStatDiv} />
              <div className={styles.heroStat}><span className={styles.heroStatN}>100%</span><span>Remote Friendly</span></div>
              <div className={styles.heroStatDiv} />
              <div className={styles.heroStat}><span className={styles.heroStatN}>Fast</span><span>Growth</span></div>
            </div>
          </div>
        </section>

        {/* ── Jobs Section ── */}
        <section className={styles.jobsSection}>
          <div className={styles.container}>

            {loading && (
              <div className={styles.stateBox}>
                <Loader2 size={32} className={styles.spin} />
                <p>Loading opportunities…</p>
              </div>
            )}

            {error && !loading && (
              <div className={styles.stateBox}>
                <AlertCircle size={28} className={styles.stateErrIcon} />
                <p>{error}</p>
              </div>
            )}

            {/* ── Empty State ── */}
            {isEmpty && (
              <div className={styles.emptyWrap}>
                <div className={styles.emptyIcon}><Briefcase size={36} /></div>
                <h2 className={styles.emptyTitle}>No Open Vacancies Right Now</h2>
                <p className={styles.emptySub}>
                  We&apos;re not actively hiring at the moment, but great talent is always welcome.
                  Follow us on social media — we&apos;ll announce new openings there first!
                </p>
                <div className={styles.socialRow}>
                  <a
                    href="https://www.instagram.com/skillinfofficial/"
                    target="_blank" rel="noreferrer"
                    className={`${styles.socialBtn} ${styles.instagram}`}
                  >
                    <Instagram size={17} /> Instagram
                  </a>
                  <a
                    href="https://www.linkedin.com/company/skillinf-official/"
                    target="_blank" rel="noreferrer"
                    className={`${styles.socialBtn} ${styles.linkedin}`}
                  >
                    <Linkedin size={17} /> LinkedIn
                  </a>
                </div>
                <p className={styles.emptyNote}>
                  We&apos;ll notify you as soon as any job vacancies are available.
                </p>
              </div>
            )}

            {/* ── Job Cards ── */}
            {!loading && !error && jobs.length > 0 && (
              <div className={styles.jobsGrid}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>Open Positions</h2>
                  <p className={styles.sectionSub}>{jobs.length} role{jobs.length !== 1 ? 's' : ''} available</p>
                </div>

                {jobs.map(job => {
                  const isOpen = expanded === job._id;
                  return (
                    <div key={job._id} className={styles.jobCard}>

                      {/* Card Top */}
                      <div className={styles.cardTop}>
                        <div className={styles.cardIcon}><Briefcase size={20} /></div>
                        <div className={styles.cardInfo}>
                          <h3 className={styles.jobTitle}>{job.title}</h3>
                          <div className={styles.jobMeta}>
                            <span><Building2 size={12} /> {job.department}</span>
                            <span className={styles.metaDot} />
                            <span><MapPin size={12} /> {job.location}</span>
                            <span className={styles.metaDot} />
                            <span><Clock size={12} /> {job.type}</span>
                            {job.experience && <><span className={styles.metaDot} /><span><Star size={12} /> {job.experience}</span></>}
                            {job.salary && <><span className={styles.metaDot} /><span><DollarSign size={12} /> {job.salary}</span></>}
                          </div>
                        </div>
                        <button
                          className={styles.applyBtnTop}
                          onClick={() => openApply(job)}
                          id={`apply-${job._id}`}
                        >
                          Apply Now <ArrowRight size={14} />
                        </button>
                      </div>

                      {/* Description short */}
                      {job.description && (
                        <p className={styles.jobDesc}>
                          {job.description.length > 180 && !isOpen
                            ? job.description.slice(0, 180) + '…'
                            : job.description}
                        </p>
                      )}

                      {/* Expandable details */}
                      {isOpen && (
                        <div className={styles.cardDetails}>
                          <JobSection title="Responsibilities" text={job.responsibilities} />
                          <JobSection title="Requirements"     text={job.requirements} />
                          <JobSection title="Nice to Have"     text={job.niceToHave} />
                          <JobSection title="Benefits & Perks" text={job.benefits} />
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className={styles.cardFoot}>
                        <button
                          className={styles.toggleBtn}
                          onClick={() => setExpanded(isOpen ? null : job._id)}
                        >
                          {isOpen
                            ? <><ChevronUp size={15} /> Show Less</>
                            : <><ChevronDown size={15} /> View Details</>}
                        </button>
                        <button
                          className={styles.applyBtnFoot}
                          onClick={() => openApply(job)}
                        >
                          Apply Now <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Culture strip ── */}
        <section className={styles.cultureStrip}>
          <div className={styles.container}>
            <p className={styles.cultureText}>
              🌱 We&apos;re a remote-first, mission-driven team building the future of digital skills.
              <a href="/about" className={styles.cultureLink}> Learn about us →</a>
            </p>
          </div>
        </section>

      </main>

      {/* ═══════════════════════════════════════
          APPLY MODAL
      ═══════════════════════════════════════ */}
      {applyJob && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeApply(); }}>
          <div className={styles.modal}>

            {/* Modal header */}
            <div className={styles.modalHead}>
              <div>
                <p className={styles.modalSup}>Applying for</p>
                <p className={styles.modalJobTitle}>{applyJob.title}</p>
                <p className={styles.modalJobMeta}>
                  <Building2 size={11} /> {applyJob.department}
                  &nbsp;·&nbsp;<MapPin size={11} /> {applyJob.location}
                  &nbsp;·&nbsp;<Clock size={11} /> {applyJob.type}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={closeApply} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {submitMsg?.ok ? (
                <div className={styles.successState}>
                  <div className={styles.successIcon}><CheckCircle size={36} /></div>
                  <h3 className={styles.successTitle}>Application Sent!</h3>
                  <p className={styles.successSub}>{submitMsg.text}</p>
                </div>
              ) : (
                <form onSubmit={handleApply} noValidate className={styles.applyForm}>

                  <div className={styles.formSection}>
                    <p className={styles.formSectionLabel}>Personal Information</p>

                    <div className={styles.formRow2}>
                      <div className={styles.formField}>
                        <label className={styles.fLabel} htmlFor="ap-name">
                          <User size={12} /> Full Name <span className={styles.req}>*</span>
                        </label>
                        <input id="ap-name" className={styles.fInput}
                          placeholder="Ravi Kumar" value={form.name} onChange={set('name')} />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fLabel} htmlFor="ap-email">
                          <Mail size={12} /> Email Address <span className={styles.req}>*</span>
                        </label>
                        <input id="ap-email" type="email" className={styles.fInput}
                          placeholder="you@example.com" value={form.email} onChange={set('email')} />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formField}>
                        <label className={styles.fLabel} htmlFor="ap-phone">
                          <Phone size={12} /> Phone Number
                        </label>
                        <input id="ap-phone" className={styles.fInput}
                          placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fLabel} htmlFor="ap-role">
                          <Briefcase size={12} /> Current Role / Title
                        </label>
                        <input id="ap-role" className={styles.fInput}
                          placeholder="e.g. Junior Developer" value={form.currentRole} onChange={set('currentRole')} />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <p className={styles.formSectionLabel}>Experience & Links</p>

                    <div className={styles.formRow2}>
                      <div className={styles.formField}>
                        <label className={styles.fLabel} htmlFor="ap-exp">
                          <Star size={12} /> Years of Experience
                        </label>
                        <select id="ap-exp" className={styles.fSelect} value={form.experience} onChange={set('experience')}>
                          <option value="">— Select —</option>
                          <option>Fresher (0 years)</option>
                          <option>Less than 1 year</option>
                          <option>1-2 years</option>
                          <option>2-3 years</option>
                          <option>3-5 years</option>
                          <option>5+ years</option>
                        </select>
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fLabel} htmlFor="ap-portfolio">
                          <Link2 size={12} /> Portfolio / GitHub URL
                        </label>
                        <input id="ap-portfolio" className={styles.fInput}
                          placeholder="https://github.com/you" value={form.portfolio} onChange={set('portfolio')} />
                      </div>
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.fLabel} htmlFor="ap-resume">
                        <FileText size={12} /> Resume Link <span className={styles.hint}>(Google Drive / Dropbox)</span>
                      </label>
                      <input id="ap-resume" className={styles.fInput}
                        placeholder="https://drive.google.com/..." value={form.resumeLink} onChange={set('resumeLink')} />
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <p className={styles.formSectionLabel}>Cover Letter</p>
                    <div className={styles.formField}>
                      <label className={styles.fLabel} htmlFor="ap-cover">
                        Why do you want to join Skillinf? <span className={styles.hint}>(optional)</span>
                      </label>
                      <textarea id="ap-cover" className={styles.fTextarea} rows={5}
                        placeholder="Tell us why you're a great fit for this role and what excites you about Skillinf…"
                        value={form.coverLetter} onChange={set('coverLetter')} />
                    </div>
                  </div>

                  {submitMsg && !submitMsg.ok && (
                    <p className={styles.formErr}>
                      <AlertCircle size={14} /> {submitMsg.text}
                    </p>
                  )}

                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={closeApply}>Cancel</button>
                    <button id="submit-application-btn" type="submit" className={styles.submitBtn} disabled={submitting}>
                      {submitting
                        ? <><Loader2 size={15} className={styles.spin} /> Submitting…</>
                        : <><Send size={15} /> Submit Application</>}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

function JobSection({ title, text }: { title: string; text: string }) {
  if (!text?.trim()) return null;
  return (
    <div className={styles.detailSection}>
      <p className={styles.detailTitle}>{title}</p>
      <div className={styles.detailBody}>
        {text.split('\n').filter(Boolean).map((line, i) => (
          <p key={i} className={styles.detailLine}>{line}</p>
        ))}
      </div>
    </div>
  );
}
