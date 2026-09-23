'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { FileText, Loader2, AlertCircle, Search, Users } from 'lucide-react';
import styles from './Applications.module.css';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  domain: string;
  college: string | null;
  linkedinVerified: boolean;
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  eCertPaid: boolean;
  physicalCertPaid: boolean;
  createdAt: string | null;
}

const STEPS = [
  { key: 'linkedinVerified', label: 'LinkedIn\nVerified' },
  { key: 'step1',            label: 'Step 1\nDone' },
  { key: 'step2',            label: 'Step 2\nDone' },
  { key: 'step3',            label: 'Step 3\nDone' },
  { key: 'step4',            label: 'Step 4\nDone' },
  { key: 'eCertPaid',        label: 'E-Cert\nPaid' },
  { key: 'physicalCertPaid', label: 'Physical\nCert Paid' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

function ProgressTick({ done, index }: { done: boolean; index: number }) {
  // Color theme per step group
  const colors = [
    '#0a66c2', // LinkedIn blue
    '#7c3aed', '#7c3aed', '#7c3aed', '#7c3aed', // Steps 1-4 purple
    '#00b894', // e-cert green
    '#f59e0b', // physical amber
  ];
  const color = colors[index];
  return (
    <div
      className={`${styles.tick} ${done ? styles.tickDone : styles.tickEmpty}`}
      style={done ? { background: color, borderColor: color } : {}}
      title={done ? STEPS[index].label.replace('\n', ' ') + ': Complete' : STEPS[index].label.replace('\n', ' ') + ': Incomplete'}
    >
      {done && (
        <svg viewBox="0 0 12 10" fill="none" className={styles.tickSvg}>
          <path d="M1 5l3 4 7-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function progressCount(u: UserRecord) {
  return STEPS.filter(s => u[s.key as StepKey]).length;
}

export default function ApplicationsPage() {
  const [records, setRecords] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true); setError('');
    fetch('/api/applications')
      .then(r => r.json())
      .then(d => { if (d.success) setRecords(d.users); else setError(d.message || 'Failed.'); })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() =>
    search.trim()
      ? records.filter(r =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase()) ||
          r.domain.toLowerCase().includes(search.toLowerCase()) ||
          (r.college ?? '').toLowerCase().includes(search.toLowerCase()))
      : records,
    [records, search]);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Applications</h1>
          <p className={styles.description}>
            All registered interns with their 7-step completion progress.
          </p>
        </div>
        <div className={styles.countPill}>
          <Users size={14} />
          {loading ? '…' : `${filtered.length} / ${records.length} interns`}
        </div>
      </header>

      {/* ── Search ─────────────────────────────────── */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name, email or domain…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── States ─────────────────────────────────── */}
      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spinner} />
          <p>Loading applications…</p>
        </div>
      )}
      {error && !loading && (
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          <AlertCircle size={22} />
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && records.length === 0 && (
        <div className={styles.stateBox}>
          <FileText size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No applications yet</p>
          <p className={styles.emptyHint}>Registered interns will appear here.</p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────── */}
      {!loading && !error && records.length > 0 && (
        <>
          {/* Desktop — table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thStudent}>Student</th>
                  <th className={styles.thDomain}>Domain</th>
                  <th className={styles.thDomain}>College / University</th>
                  <th className={styles.thJoined}>Joined</th>
                  <th className={styles.thProgress}>Progress</th>
                  {STEPS.map((s, i) => (
                    <th key={s.key} className={styles.thCheck}>
                      <span className={styles.stepLabel} style={{ whiteSpace: 'pre-line' }}>{s.label}</span>
                      <span className={`${styles.stepNum} ${i === 0 ? styles.stepNumLi : i < 5 ? styles.stepNumStep : i === 5 ? styles.stepNumEcert : styles.stepNumPhys}`}>
                        {i === 0 ? 'LI' : i < 5 ? i : i === 5 ? '₹E' : '₹P'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const done = progressCount(u);
                  const pct = Math.round((done / 7) * 100);
                  return (
                    <tr key={u.id} className={styles.row}>
                      <td className={styles.tdStudent}>
                        <p className={styles.studentName}>{u.name}</p>
                        <p className={styles.studentEmail}>{u.email}</p>
                      </td>
                      <td className={styles.tdDomain}>
                        <span className={styles.domainBadge}>{u.domain}</span>
                      </td>
                      <td className={styles.tdDomain}>
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>{u.college ?? <span style={{ color: '#cbd5e1' }}>—</span>}</span>
                      </td>
                      <td className={styles.tdDate}>{fmtDate(u.createdAt)}</td>
                      <td className={styles.tdProgress}>
                        <div className={styles.progRow}>
                          <div className={styles.progTrack}>
                            <div className={styles.progFill} style={{ width: `${pct}%`, background: pct === 100 ? '#00b894' : pct >= 70 ? '#7c3aed' : '#3b82f6' }} />
                          </div>
                          <span className={styles.progLabel}>{done}/7</span>
                        </div>
                      </td>
                      {STEPS.map((s, i) => (
                        <td key={s.key} className={styles.tdCheck}>
                          <ProgressTick done={u[s.key as StepKey] as boolean} index={i} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile — cards */}
          <div className={styles.cardList}>
            {filtered.map(u => {
              const done = progressCount(u);
              const pct = Math.round((done / 7) * 100);
              return (
                <div key={u.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div>
                      <p className={styles.cardName}>{u.name}</p>
                      <p className={styles.cardEmail}>{u.email}</p>
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.domainBadge}>{u.domain}</span>
                      {u.college && <span style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>🎓 {u.college}</span>}
                      <span style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{fmtDate(u.createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.cardProgRow}>
                    <div className={styles.progTrack} style={{ flex: 1 }}>
                      <div className={styles.progFill} style={{ width: `${pct}%`, background: pct === 100 ? '#00b894' : pct >= 70 ? '#7c3aed' : '#3b82f6' }} />
                    </div>
                    <span className={styles.progLabel}>{done}/7</span>
                  </div>
                  <div className={styles.cardTicks}>
                    {STEPS.map((s, i) => {
                      const isDone = u[s.key as StepKey] as boolean;
                      return (
                        <span key={s.key} className={`${styles.cardTick} ${isDone ? styles.cardTickDone : ''}`}>
                          <ProgressTick done={isDone} index={i} />
                          {s.label.replace('\n', ' ')}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Legend ─────────────────────────────────── */}
      {!loading && records.length > 0 && (
        <div className={styles.legend}>
          <span className={styles.legendTitle}>Legend:</span>
          {STEPS.map((s, i) => (
            <span key={s.key} className={styles.legendItem}>
              <span className={styles.legendDot} style={{
                background: [
                  '#0a66c2', '#7c3aed', '#7c3aed', '#7c3aed', '#7c3aed', '#00b894', '#f59e0b'
                ][i]
              }} />
              {s.label.replace('\n', ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
