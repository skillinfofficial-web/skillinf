'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Link2, Loader2, AlertCircle, ExternalLink, FolderOpen, ChevronDown, ChevronUp, Search, Phone, Mail, Send } from 'lucide-react';
import styles from './LinkedInVerify.module.css';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface LinkedInRecord {
  _id: string; userId: string; name: string; email: string;
  linkedinUrl: string; status: 'pending' | 'approved' | 'rejected';
  createdAt: string; updatedAt: string;
  startDate?: string | null;
  endDate?:   string | null;
  domain?:    string | null;
}
interface ProjectReview {
  _id: string; userId: string; name: string; email: string;
  mobileNumber?: string; domain: string; step: number; driveLink: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; updatedAt: string;
  submittedAt?: string | null;
  weekDeadlineDate?: string | null;
  weekProjectTitle?: string | null;
  weekProjectDescription?: string | null;
}
interface PersonGroup {
  email: string; name: string; mobileNumber: string; domain: string;
  reviews: ProjectReview[];
  pendingCount: number;
}

const liStatusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const liStatusClass = { pending: 'pending', approved: 'approved', rejected: 'rejected' };
const prStatusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const prStatusClass = { pending: 'pending', approved: 'approved', rejected: 'rejected' };

export default function LinkedInVerifyPage() {
  const [tab, setTab] = useState<'linkedin' | 'projects'>('linkedin');

  /* ── LinkedIn state ── */
  const [records,   setRecords]   = useState<LinkedInRecord[]>([]);
  const [liLoading, setLiLoading] = useState(true);
  const [liError,   setLiError]   = useState('');
  const [liActionMsg, setLiActionMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [liBusyId,  setLiBusyId]  = useState<string | null>(null);
  const [liSearch,  setLiSearch]  = useState('');

  /* ── Project Reviews state ── */
  const [reviews,   setReviews]   = useState<ProjectReview[]>([]);
  const [prLoading, setPrLoading] = useState(true);
  const [prError,   setPrError]   = useState('');
  const [prActionMsg, setPrActionMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [prBusyId,  setPrBusyId]  = useState<string | null>(null);
  const [prSearch,  setPrSearch]  = useState('');
  // expanded: which person containers + which step rows are open
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [expandedStep,   setExpandedStep]   = useState<string | null>(null);

  /* ── Reject email modal state ── */
  const [rejectModal, setRejectModal] = useState<{
    reviewId: string; name: string; email: string; step: number;
  } | null>(null);
  const [rejectContent, setRejectContent] = useState('');
  const [rejectSending, setRejectSending] = useState(false);
  const [rejectResult,  setRejectResult]  = useState<{ ok: boolean; msg: string } | null>(null);

  /* ── Loaders ── */
  const loadLi = () => {
    setLiLoading(true); setLiError('');
    fetch('/api/linkedin-verify')
      .then(r => r.json())
      .then(d => { if (d.success) setRecords(d.records); else setLiError(d.message); })
      .catch(() => setLiError('Network error.'))
      .finally(() => setLiLoading(false));
  };
  const loadPr = () => {
    setPrLoading(true); setPrError('');
    fetch('/api/project-reviews')
      .then(r => r.json())
      .then(d => { if (d.success) setReviews(d.reviews); else setPrError(d.message); })
      .catch(() => setPrError('Network error.'))
      .finally(() => setPrLoading(false));
  };

  useEffect(() => { loadLi(); loadPr(); }, []);

  /* ── Group reviews by email ── */
  const personGroups = useMemo<PersonGroup[]>(() => {
    const map = new Map<string, PersonGroup>();
    reviews.forEach(r => {
      if (!map.has(r.email)) {
        map.set(r.email, {
          email: r.email, name: r.name,
          mobileNumber: r.mobileNumber ?? '',
          domain: r.domain, reviews: [], pendingCount: 0,
        });
      }
      const g = map.get(r.email)!;
      g.reviews.push(r);
      if (r.status === 'pending') g.pendingCount++;
    });
    const latestTime = (g: PersonGroup, statusFilter?: string) => {
      const filtered = statusFilter ? g.reviews.filter(r => r.status === statusFilter) : g.reviews;
      if (!filtered.length) return 0;
      return Math.max(...filtered.map(r => new Date(r.submittedAt ?? r.createdAt).getTime()));
    };
    // Sort: most recent PENDING first, then most recent any submission, then alphabetical
    return Array.from(map.values()).sort((a, b) => {
      if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount;
      const tA = latestTime(a, 'pending') || latestTime(a);
      const tB = latestTime(b, 'pending') || latestTime(b);
      if (tB !== tA) return tB - tA;
      return a.name.localeCompare(b.name);
    });
  }, [reviews]);

  /* ── Project reviews search filter ── */
  const filteredPersonGroups = useMemo(() => {
    if (!prSearch.trim()) return personGroups;
    const q = prSearch.toLowerCase();
    return personGroups.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.domain.toLowerCase().includes(q)
    );
  }, [personGroups, prSearch]);

  /* ── LinkedIn action ── */
  const liAct = async (record: LinkedInRecord, action: 'verify' | 'unverify') => {
    setLiBusyId(record._id); setLiActionMsg(null);
    try {
      const res  = await fetch('/api/linkedin-verify', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: record.userId, action }),
      });
      const data = await res.json();
      setLiActionMsg({ id: record._id, msg: data.message, ok: data.success });
      if (data.success) loadLi();
    } catch { setLiActionMsg({ id: record._id, msg: 'Network error.', ok: false }); }
    finally { setLiBusyId(null); }
  };

  /* ── Project review action ── */
  const prAct = async (review: ProjectReview, action: 'approve' | 'reject') => {
    setPrBusyId(review._id); setPrActionMsg(null);
    try {
      const res  = await fetch('/api/project-reviews', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review._id, action }),
      });
      const data = await res.json();
      setPrActionMsg({ id: review._id, msg: data.message, ok: data.success });
      if (data.success) {
        loadPr();
        // On reject — open the email compose modal
        if (action === 'reject') {
          setRejectModal({ reviewId: review._id, name: data.name, email: data.email, step: data.step });
          setRejectContent('');
          setRejectResult(null);
        }
      }
    } catch { setPrActionMsg({ id: review._id, msg: 'Network error.', ok: false }); }
    finally { setPrBusyId(null); }
  };

  /* ── Send rejection email ── */
  const sendRejectEmail = async () => {
    if (!rejectModal || !rejectContent.trim()) return;
    setRejectSending(true); setRejectResult(null);
    try {
      const res  = await fetch('/api/project-reviews/reject-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: rejectModal.reviewId, content: rejectContent }),
      });
      const data = await res.json();
      setRejectResult({ ok: data.success, msg: data.message });
      if (data.success) setTimeout(() => setRejectModal(null), 2000);
    } catch { setRejectResult({ ok: false, msg: 'Network error. Try again.' }); }
    finally { setRejectSending(false); }
  };

  const fmtDate = (d: string) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const pendingPr = reviews.filter(r => r.status === 'pending').length;

  // LinkedIn search filter
  const filteredRecords = liSearch.trim()
    ? records.filter(r => {
        const q = liSearch.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      })
    : records;

  return (
    <div className={styles.page}>

      {/* ── Reject Email Modal ── */}
      {rejectModal && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}><Mail size={20} /></div>
              <div>
                <p className={styles.modalTitle}>Send Rejection Email</p>
                <p className={styles.modalSubtitle}>
                  To: <strong>{rejectModal.name}</strong> · {rejectModal.email} · Week {rejectModal.step}
                </p>
              </div>
            </div>

            <div className={styles.modalSubjectRow}>
              <span className={styles.modalSubjectLabel}>Subject</span>
              <span className={styles.modalSubjectValue}>Project Submission Rejected — Action Required | Skillinf</span>
            </div>

            <label className={styles.modalLabel} htmlFor="reject-content">Message to student</label>
            <textarea
              id="reject-content"
              className={styles.modalTextarea}
              rows={7}
              placeholder={`Hi ${rejectModal.name},\n\nYour Week ${rejectModal.step} project submission could not be verified.\n\nReason: [write the reason here]\n\nPlease resubmit via your dashboard.`}
              value={rejectContent}
              onChange={e => setRejectContent(e.target.value)}
              autoFocus
            />

            {rejectResult && (
              <p className={`${styles.modalFeedback} ${rejectResult.ok ? styles.modalFeedbackOk : styles.modalFeedbackErr}`}>
                {rejectResult.msg}
              </p>
            )}

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setRejectModal(null)}
                disabled={rejectSending}
              >
                Cancel
              </button>
              <button
                id="send-reject-email-btn"
                className={styles.modalSendBtn}
                onClick={sendRejectEmail}
                disabled={rejectSending || !rejectContent.trim()}
              >
                {rejectSending
                  ? <><Loader2 size={14} className={styles.btnSpinner} /> Sending…</>
                  : <><Send size={14} /> Send Email</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Verifications &amp; Reviews</h1>
          <p className={styles.description}>Manage LinkedIn post verifications and student project submissions.</p>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button
          id="tab-linkedin"
          className={`${styles.tabBtn} ${tab === 'linkedin' ? styles.tabActive : ''}`}
          onClick={() => setTab('linkedin')}
        >
          <Link2 size={15} /> LinkedIn Verification
          {records.filter(r => r.status === 'pending').length > 0 && (
            <span className={styles.tabBadge}>{records.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
        <button
          id="tab-projects"
          className={`${styles.tabBtn} ${tab === 'projects' ? styles.tabActive : ''}`}
          onClick={() => setTab('projects')}
        >
          <FolderOpen size={15} /> Project Reviews
          {pendingPr > 0 && <span className={`${styles.tabBadge} ${styles.tabBadgeOrange}`}>{pendingPr}</span>}
        </button>
      </div>

      {/* ══════════════════ LINKEDIN TAB ══════════════════ */}
      {tab === 'linkedin' && (
        <>
          {/* Search bar */}
          <div className={styles.liSearchRow}>
            <div className={styles.liSearchWrap}>
              <Search size={15} className={styles.liSearchIcon} />
              <input
                type="text"
                id="li-search"
                className={styles.liSearchInput}
                placeholder="Search by name or email…"
                value={liSearch}
                onChange={e => setLiSearch(e.target.value)}
              />
              {liSearch && (
                <button className={styles.liSearchClear} onClick={() => setLiSearch('')}>✕</button>
              )}
            </div>
          </div>
          <div className={styles.counts}>
            <span className={styles.countPill}>{records.filter(r => r.status === 'pending').length} Pending</span>
            <span className={`${styles.countPill} ${styles.countApproved}`}>{records.filter(r => r.status === 'approved').length} Approved</span>
            {liSearch.trim() && (
              <span className={styles.countPill} style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                {filteredRecords.length} found
              </span>
            )}
          </div>

          {liLoading && <div className={styles.stateBox}><Loader2 size={26} className={styles.spinner} /><p>Loading…</p></div>}
          {liError && !liLoading && <div className={`${styles.stateBox} ${styles.errorBox}`}><AlertCircle size={22} /><p>{liError}</p></div>}
          {!liLoading && !liError && records.length === 0 && (
            <div className={styles.stateBox}>
              <Link2 size={40} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No submissions yet</p>
              <p className={styles.emptyHint}>LinkedIn post submissions will appear here once students submit.</p>
            </div>
          )}
          {!liLoading && !liError && records.length > 0 && filteredRecords.length === 0 && (
            <div className={styles.stateBox}>
              <Search size={36} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No matching submissions</p>
              <p className={styles.emptyHint}>No submissions match &ldquo;{liSearch}&rdquo;. Try checking the spelling.</p>
            </div>
          )}
          {!liLoading && !liError && filteredRecords.length > 0 && (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr>
                    <th>Student</th><th>LinkedIn Post</th><th>Internship Dates</th><th>Status</th><th>Submitted</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredRecords.map(rec => (
                      <tr key={rec._id} className={styles.row}>
                        <td className={styles.studentCell}>
                          <p className={styles.studentName}>{rec.name}</p>
                          <p className={styles.studentEmail}>{rec.email}</p>
                        </td>
                        <td className={styles.urlCell}>
                          <a href={rec.linkedinUrl} target="_blank" rel="noreferrer" className={styles.urlLink}>
                            <ExternalLink size={13} /> View Post
                          </a>
                          <p className={styles.urlText}>{rec.linkedinUrl}</p>
                        </td>
                        <td className={styles.internshipDatesCell}>
                          {rec.startDate
                            ? <><span className={styles.dateChip}>{new Date(rec.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span><span className={styles.dateSep}>→</span><span className={styles.dateChip}>{rec.endDate ? new Date(rec.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</span></>
                            : <span className={styles.dateNa}>—</span>
                          }
                        </td>
                        <td><span className={`${styles.statusBadge} ${styles[liStatusClass[rec.status]]}`}>{liStatusLabel[rec.status]}</span></td>
                        <td className={styles.dateCell}>{fmtDate(rec.createdAt)}</td>
                        <td className={styles.actionsCell}>
                          <button className={`${styles.btn} ${styles.verifyBtn}`} onClick={() => liAct(rec, 'verify')} disabled={liBusyId === rec._id || rec.status === 'approved'}>
                            {liBusyId === rec._id ? <Loader2 size={14} className={styles.btnSpinner} /> : <CheckCircle2 size={14} />} Verify
                          </button>
                          <button className={`${styles.btn} ${styles.rejectBtn}`} onClick={() => liAct(rec, 'unverify')} disabled={liBusyId === rec._id || rec.status === 'rejected'}>
                            {liBusyId === rec._id ? <Loader2 size={14} className={styles.btnSpinner} /> : <XCircle size={14} />} Unverify
                          </button>
                          {liActionMsg?.id === rec._id && (
                            <p className={`${styles.actionFeedback} ${liActionMsg.ok ? styles.feedbackOk : styles.feedbackErr}`}>{liActionMsg.msg}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.cardList}>
                {filteredRecords.map(rec => (
                  <div key={rec._id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div><p className={styles.cardName}>{rec.name}</p><p className={styles.cardEmail}>{rec.email}</p></div>
                      <span className={`${styles.statusBadge} ${styles[liStatusClass[rec.status]]}`}>{liStatusLabel[rec.status]}</span>
                    </div>
                    <div className={styles.cardRows}>
                      <div className={styles.cardRow}><span className={styles.cardRowLabel}>🔗 Post</span><span className={styles.cardRowValue}><a href={rec.linkedinUrl} target="_blank" rel="noreferrer" className={styles.urlLink}><ExternalLink size={12} /> View Post</a></span></div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardRowLabel}>Period</span>
                        <span className={styles.cardRowValue}>
                          {rec.startDate ? (
                            <>
                              {new Date(rec.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                              {' → '}
                              {rec.endDate ? new Date(rec.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                            </>
                          ) : (
                            <span className={styles.dateNa}>—</span>
                          )}
                        </span>
                      </div>
                      <div className={styles.cardRow}><span className={styles.cardRowLabel}>Submitted</span><span className={styles.cardRowValue}>{fmtDate(rec.createdAt)}</span></div>
                    </div>
                    <div className={styles.cardActions}>
                      <button className={`${styles.btn} ${styles.verifyBtn}`} onClick={() => liAct(rec, 'verify')} disabled={liBusyId === rec._id || rec.status === 'approved'} style={{ flex: 1 }}>
                        {liBusyId === rec._id ? <Loader2 size={14} className={styles.btnSpinner} /> : <CheckCircle2 size={14} />} Verify
                      </button>
                      <button className={`${styles.btn} ${styles.rejectBtn}`} onClick={() => liAct(rec, 'unverify')} disabled={liBusyId === rec._id || rec.status === 'rejected'} style={{ flex: 1 }}>
                        {liBusyId === rec._id ? <Loader2 size={14} className={styles.btnSpinner} /> : <XCircle size={14} />} Unverify
                      </button>
                    </div>
                    {liActionMsg?.id === rec._id && (
                      <p className={`${styles.actionFeedback} ${liActionMsg.ok ? styles.feedbackOk : styles.feedbackErr}`}>{liActionMsg.msg}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════ PROJECT REVIEWS TAB ══════════════════ */}
      {tab === 'projects' && (
        <>
          {/* Search bar */}
          <div className={styles.liSearchRow}>
            <div className={styles.liSearchWrap}>
              <Search size={15} className={styles.liSearchIcon} />
              <input
                type="text"
                id="pr-search"
                className={styles.liSearchInput}
                placeholder="Search by name, email or domain…"
                value={prSearch}
                onChange={e => setPrSearch(e.target.value)}
              />
              {prSearch && (
                <button className={styles.liSearchClear} onClick={() => setPrSearch('')}>✕</button>
              )}
            </div>
          </div>

          <div className={styles.counts}>
            <span className={styles.countPill}>{reviews.filter(r => r.status === 'pending').length} Pending</span>
            <span className={`${styles.countPill} ${styles.countApproved}`}>{reviews.filter(r => r.status === 'approved').length} Approved</span>
            <span className={`${styles.countPill} ${styles.countRejected}`}>{reviews.filter(r => r.status === 'rejected').length} Rejected</span>
            <span className={styles.countPill} style={{ marginLeft: 'auto' }}>
              {prSearch.trim() ? `${filteredPersonGroups.length} / ${personGroups.length}` : personGroups.length}
              {' '}{personGroups.length === 1 ? 'Student' : 'Students'}
            </span>
          </div>

          {prLoading && <div className={styles.stateBox}><Loader2 size={26} className={styles.spinner} /><p>Loading…</p></div>}
          {prError && !prLoading && <div className={`${styles.stateBox} ${styles.errorBox}`}><AlertCircle size={22} /><p>{prError}</p></div>}
          {!prLoading && !prError && personGroups.length === 0 && (
            <div className={styles.stateBox}>
              <FolderOpen size={40} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No project submissions yet</p>
              <p className={styles.emptyHint}>Student project submissions will appear here.</p>
            </div>
          )}
          {!prLoading && !prError && personGroups.length > 0 && filteredPersonGroups.length === 0 && (
            <div className={styles.stateBox}>
              <Search size={36} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No matching students</p>
              <p className={styles.emptyHint}>No submissions match &ldquo;{prSearch}&rdquo;. Try a different name, email or domain.</p>
            </div>
          )}

          {/* ── One container per person ── */}
          {!prLoading && !prError && filteredPersonGroups.length > 0 && (
            <div className={styles.prList}>
              {filteredPersonGroups.map(person => {
                const isPersonOpen = expandedPerson === person.email;
                return (
                  <div key={person.email} className={`${styles.personCard} ${person.pendingCount > 0 ? styles.personCardPending : ''}`}>

                    {/* ── Person header ── */}
                    <div
                      className={styles.personHead}
                      onClick={() => setExpandedPerson(isPersonOpen ? null : person.email)}
                    >
                      <div className={styles.personHeadLeft}>
                        {/* Avatar initials */}
                        <div className={styles.personAvatar}>
                          {person.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className={styles.personName}>{person.name}</p>
                          <div className={styles.personMeta}>
                            <span>{person.email}</span>
                            <span className={styles.personDot}>·</span>
                            <span className={styles.personDomain}>{person.domain}</span>
                            {person.mobileNumber && (
                              <>
                                <span className={styles.personDot}>·</span>
                                <span className={styles.personMobile}>
                                  <Phone size={11} /> {person.mobileNumber}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={styles.personHeadRight}>
                        {person.pendingCount > 0 && (
                          <span className={styles.personPendingBadge}>{person.pendingCount} pending</span>
                        )}
                        <span className={styles.personStepCount}>{person.reviews.length} step{person.reviews.length !== 1 ? 's' : ''}</span>
                        {isPersonOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* ── Step rows (expanded) ── */}
                    {isPersonOpen && (
                      <div className={styles.personBody}>
                        {person.reviews
                          .slice()
                          .sort((a, b) => a.step - b.step)
                          .map(rev => {
                            const stepKey = `${person.email}-${rev.step}`;
                            const isStepOpen = expandedStep === stepKey;
                            return (
                              <div
                                key={rev._id}
                                className={`${styles.stepRow} ${rev.status === 'pending' ? styles.stepRowPending : rev.status === 'approved' ? styles.stepRowApproved : styles.stepRowRejected}`}
                              >
                                {/* Step row header */}
                                <div
                                  className={styles.stepRowHead}
                                  onClick={() => setExpandedStep(isStepOpen ? null : stepKey)}
                                >
                                  <div className={styles.stepRowLeft}>
                                    <span className={styles.prStepBadge}>Step {rev.step}</span>
                                    <span className={`${styles.statusBadge} ${styles[prStatusClass[rev.status]]}`}>
                                      {prStatusLabel[rev.status]}
                                    </span>
                                    <span className={styles.stepRowDate}>Submitted: {fmtDate(rev.submittedAt ?? rev.createdAt)}</span>
                                    {rev.weekDeadlineDate && (
                                      <span className={styles.stepRowDeadline}>
                                        Week End: {new Date(rev.weekDeadlineDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                  <span className={styles.prChevron}>{isStepOpen ? '▲' : '▼'}</span>
                                </div>

                                {/* Step row body */}
                                {isStepOpen && (
                                  <div className={styles.stepRowBody}>
                                    {/* Assigned project from course DB */}
                                    {(rev.weekProjectTitle || rev.weekProjectDescription) && (
                                      <div className={styles.assignedCard}>
                                        <p className={styles.assignedCardLabel}>Assigned Project</p>
                                        {rev.weekProjectTitle && (
                                          <p className={styles.assignedCardTitle}>{rev.weekProjectTitle}</p>
                                        )}
                                        {rev.weekProjectDescription && (
                                          <p className={styles.assignedCardDesc}>{rev.weekProjectDescription}</p>
                                        )}
                                      </div>
                                    )}
                                    {/* Student submission */}
                                    <div className={styles.prRow}>
                                      <span className={styles.prRowLabel}>Student Submission</span>
                                      <a href={rev.driveLink} target="_blank" rel="noreferrer" className={styles.urlLink}>
                                        <ExternalLink size={12} /> Open Project
                                      </a>
                                    </div>
                                    <p className={styles.prLinkText}>{rev.driveLink}</p>

                                    {prActionMsg?.id === rev._id && (
                                      <p className={`${styles.actionFeedback} ${prActionMsg.ok ? styles.feedbackOk : styles.feedbackErr}`}>
                                        {prActionMsg.msg}
                                      </p>
                                    )}

                                    {rev.status !== 'approved' && (
                                      <div className={styles.prActions}>
                                        <button
                                          id={`approve-project-${rev._id}`}
                                          className={`${styles.btn} ${styles.verifyBtn}`}
                                          onClick={() => prAct(rev, 'approve')}
                                          disabled={prBusyId === rev._id}
                                        >
                                          {prBusyId === rev._id ? <Loader2 size={14} className={styles.btnSpinner} /> : <CheckCircle2 size={14} />}
                                          Approve &amp; Unlock Next Step
                                        </button>
                                        {rev.status !== 'rejected' && (
                                          <button
                                            id={`reject-project-${rev._id}`}
                                            className={`${styles.btn} ${styles.rejectBtn}`}
                                            onClick={() => prAct(rev, 'reject')}
                                            disabled={prBusyId === rev._id}
                                          >
                                            {prBusyId === rev._id ? <Loader2 size={14} className={styles.btnSpinner} /> : <XCircle size={14} />}
                                            Reject
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}





