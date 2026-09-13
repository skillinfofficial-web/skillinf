'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Link2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

import styles from './LinkedInVerify.module.css';

interface LinkedInRecord {
  _id: string;
  userId: string;
  name: string;
  email: string;
  linkedinUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

const statusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const statusClass = { pending: 'pending', approved: 'approved', rejected: 'rejected' };

export default function LinkedInVerifyPage() {
  const [records, setRecords] = useState<LinkedInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [actionMsg, setActionMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [busyId,  setBusyId]  = useState<string | null>(null);

  const load = () => {
    setLoading(true); setError('');
    fetch('/api/linkedin-verify')
      .then(r => r.json())
      .then(d => { if (d.success) setRecords(d.records); else setError(d.message); })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (record: LinkedInRecord, action: 'verify' | 'unverify') => {
    setBusyId(record._id); setActionMsg(null);
    try {
      const res  = await fetch('/api/linkedin-verify', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: record.userId, action }),
      });
      const data = await res.json();
      setActionMsg({ id: record._id, msg: data.message, ok: data.success });
      if (data.success) load();
    } catch {
      setActionMsg({ id: record._id, msg: 'Network error.', ok: false });
    } finally { setBusyId(null); }
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>LinkedIn Verification</h1>
          <p className={styles.description}>Review student LinkedIn post submissions and approve or reject them.</p>
        </div>
        <div className={styles.counts}>
          <span className={styles.countPill}>{records.filter(r => r.status === 'pending').length} Pending</span>
          <span className={`${styles.countPill} ${styles.countApproved}`}>{records.filter(r => r.status === 'approved').length} Approved</span>
        </div>
      </header>

      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spinner} />
          <p>Loading submissions…</p>
        </div>
      )}

      {error && !loading && (
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          <AlertCircle size={22} /> <p>{error}</p>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className={styles.stateBox}>
          <Link2 size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No submissions yet</p>
          <p className={styles.emptyHint}>LinkedIn post submissions will appear here once students submit.</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>LinkedIn Post</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
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
                  <td>
                    <span className={`${styles.statusBadge} ${styles[statusClass[rec.status]]}`}>
                      {statusLabel[rec.status]}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{fmtDate(rec.createdAt)}</td>
                  <td className={styles.actionsCell}>
                    <button
                      className={`${styles.btn} ${styles.verifyBtn}`}
                      onClick={() => act(rec, 'verify')}
                      disabled={busyId === rec._id || rec.status === 'approved'}
                      title="Verify — unlocks Step 1 for this student"
                    >
                      {busyId === rec._id ? <Loader2 size={14} className={styles.btnSpinner} /> : <CheckCircle2 size={14} />}
                      Verify
                    </button>
                    <button
                      className={`${styles.btn} ${styles.rejectBtn}`}
                      onClick={() => act(rec, 'unverify')}
                      disabled={busyId === rec._id || rec.status === 'rejected'}
                      title="Reject — student must resubmit"
                    >
                      {busyId === rec._id ? <Loader2 size={14} className={styles.btnSpinner} /> : <XCircle size={14} />}
                      Unverify
                    </button>
                    {actionMsg?.id === rec._id && (
                      <p className={`${styles.actionFeedback} ${actionMsg.ok ? styles.feedbackOk : styles.feedbackErr}`}>
                        {actionMsg.msg}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
