'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Link2, Loader2, AlertCircle, ExternalLink, FolderOpen } from 'lucide-react';
import styles from './LinkedInVerify.module.css';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface LinkedInRecord {
  _id: string; userId: string; name: string; email: string;
  linkedinUrl: string; status: 'pending' | 'approved' | 'rejected';
  createdAt: string; updatedAt: string;
}
interface ProjectReview {
  _id: string; userId: string; name: string; email: string;
  domain: string; step: number; driveLink: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; updatedAt: string;
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

  /* ── Project Reviews state ── */
  const [reviews,   setReviews]   = useState<ProjectReview[]>([]);
  const [prLoading, setPrLoading] = useState(true);
  const [prError,   setPrError]   = useState('');
  const [prActionMsg, setPrActionMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [prBusyId,  setPrBusyId]  = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<string | null>(null);

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
      if (data.success) loadPr();
    } catch { setPrActionMsg({ id: review._id, msg: 'Network error.', ok: false }); }
    finally { setPrBusyId(null); }
  };

  const fmtDate = (d: string) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const pendingPr = reviews.filter(r => r.status === 'pending').length;

  return (
    <div className={styles.page}>
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
          <div className={styles.counts}>
            <span className={styles.countPill}>{records.filter(r => r.status === 'pending').length} Pending</span>
            <span className={`${styles.countPill} ${styles.countApproved}`}>{records.filter(r => r.status === 'approved').length} Approved</span>
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
          {!liLoading && !liError && records.length > 0 && (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr>
                    <th>Student</th><th>LinkedIn Post</th><th>Status</th><th>Submitted</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {records.map(rec => (
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
                {records.map(rec => (
                  <div key={rec._id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div><p className={styles.cardName}>{rec.name}</p><p className={styles.cardEmail}>{rec.email}</p></div>
                      <span className={`${styles.statusBadge} ${styles[liStatusClass[rec.status]]}`}>{liStatusLabel[rec.status]}</span>
                    </div>
                    <div className={styles.cardRows}>
                      <div className={styles.cardRow}><span className={styles.cardRowLabel}>🔗 Post</span><span className={styles.cardRowValue}><a href={rec.linkedinUrl} target="_blank" rel="noreferrer" className={styles.urlLink}><ExternalLink size={12} /> View Post</a></span></div>
                      <div className={styles.cardRow}><span className={styles.cardRowLabel}>🕐 Date</span><span className={styles.cardRowValue}>{fmtDate(rec.createdAt)}</span></div>
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
          <div className={styles.counts}>
            <span className={styles.countPill}>{reviews.filter(r => r.status === 'pending').length} Pending</span>
            <span className={`${styles.countPill} ${styles.countApproved}`}>{reviews.filter(r => r.status === 'approved').length} Approved</span>
            <span className={`${styles.countPill} ${styles.countRejected}`}>{reviews.filter(r => r.status === 'rejected').length} Rejected</span>
          </div>

          {prLoading && <div className={styles.stateBox}><Loader2 size={26} className={styles.spinner} /><p>Loading…</p></div>}
          {prError && !prLoading && <div className={`${styles.stateBox} ${styles.errorBox}`}><AlertCircle size={22} /><p>{prError}</p></div>}
          {!prLoading && !prError && reviews.length === 0 && (
            <div className={styles.stateBox}>
              <FolderOpen size={40} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No project submissions yet</p>
              <p className={styles.emptyHint}>Student project submissions will appear here.</p>
            </div>
          )}

          {!prLoading && !prError && reviews.length > 0 && (
            <div className={styles.prList}>
              {reviews.map(rev => {
                const isOpen = expanded === rev._id;
                return (
                  <div key={rev._id} className={`${styles.prCard} ${rev.status === 'pending' ? styles.prPending : rev.status === 'approved' ? styles.prApproved : styles.prRejected}`}>
                    {/* Header row — always visible */}
                    <div className={styles.prCardHead} onClick={() => setExpanded(isOpen ? null : rev._id)}>
                      <div className={styles.prCardLeft}>
                        <span className={styles.prStepBadge}>Step {rev.step}</span>
                        <div>
                          <p className={styles.prName}>{rev.name}</p>
                          <p className={styles.prEmail}>{rev.email} · <em>{rev.domain}</em></p>
                        </div>
                      </div>
                      <div className={styles.prCardRight}>
                        <span className={`${styles.statusBadge} ${styles[prStatusClass[rev.status]]}`}>{prStatusLabel[rev.status]}</span>
                        <span className={styles.prChevron}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Expandable body */}
                    {isOpen && (
                      <div className={styles.prCardBody}>
                        <div className={styles.prRow}>
                          <span className={styles.prRowLabel}>📅 Submitted</span>
                          <span className={styles.prRowValue}>{fmtDate(rev.updatedAt)}</span>
                        </div>
                        <div className={styles.prRow}>
                          <span className={styles.prRowLabel}>📎 Project Link</span>
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
        </>
      )}
    </div>
  );
}
