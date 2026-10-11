'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText, Loader2, AlertCircle, Search, Users,
  ChevronDown, ChevronRight, Calendar, Download,
} from 'lucide-react';
import styles from './Applications.module.css';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  mobile: string;
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

// Each filter = users AT that exact stage only (milestone done, next milestone NOT done)
const FILTER_OPTIONS: { key: StepKey; label: string; notKey?: StepKey }[] = [
  { key: 'linkedinVerified', label: 'LinkedIn Verified',    notKey: 'step1'            },
  { key: 'step1',            label: 'Step 1 Only',          notKey: 'step2'            },
  { key: 'step2',            label: 'Step 2 Only',          notKey: 'step3'            },
  { key: 'step3',            label: 'Step 3 Only',          notKey: 'step4'            },
  { key: 'step4',            label: 'Step 4 Only',          notKey: 'eCertPaid'        },
  { key: 'eCertPaid',        label: 'E-Certificate Only',   notKey: 'physicalCertPaid' },
  { key: 'physicalCertPaid', label: 'Physical Certificate'                             },
];

const STEP_COLORS = ['#0a66c2', '#7c3aed', '#7c3aed', '#7c3aed', '#7c3aed', '#00b894', '#f59e0b'];

function ProgressTick({ done, index }: { done: boolean; index: number }) {
  return (
    <div
      className={`${styles.tick} ${done ? styles.tickDone : styles.tickEmpty}`}
      style={done ? { background: STEP_COLORS[index], borderColor: STEP_COLORS[index] } : {}}
      title={STEPS[index].label.replace('\n', ' ') + (done ? ': Complete' : ': Incomplete')}
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

function getMonthKey(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function sortMonthKeys(keys: string[]): string[] {
  return keys.sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return new Date('1 ' + b).getTime() - new Date('1 ' + a).getTime();
  });
}

/* ── CSV / Excel download helpers ─────────────────────────────── */
function escCsv(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function downloadCSV(users: UserRecord[]) {
  const header = ['Name', 'Email', 'Mobile Number'];
  const rows   = users.map(u => [u.name, u.email, u.mobile || '']);
  const csv    = [header, ...rows].map(r => r.map(escCsv).join(',')).join('\r\n');
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = 'skillinf_applicants.csv'; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(users: UserRecord[]) {
  // Build minimal XLSX-compatible XML (SpreadsheetML) — no external library needed
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cell = (v: string) => `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
  const row  = (cols: string[]) => `<Row>${cols.map(cell).join('')}</Row>`;

  const header = ['Name', 'Email', 'Mobile Number'];
  const dataRows = users.map(u => row([u.name, u.email, u.mobile || '']));
  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Applicants">
    <Table>
      ${row(header)}
      ${dataRows.join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'skillinf_applicants.xls'; a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ApplicationsPage() {
  const [records,    setRecords]    = useState<UserRecord[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  // Checkbox filters — set of active StepKeys
  const [activeFilters, setActiveFilters] = useState<Set<StepKey>>(new Set());

  const load = () => {
    setLoading(true); setError('');
    fetch('/api/applications')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setRecords(d.users);
          const keys = new Set<string>(d.users.map((u: UserRecord) => getMonthKey(u.createdAt)));
          setOpenMonths(keys);
        } else {
          setError(d.message || 'Failed.');
        }
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleFilter = (key: StepKey) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  // Apply search + checkbox stage filters
  const filtered = useMemo(() => {
    let r = records;
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.domain.toLowerCase().includes(q) ||
        (u.college ?? '').toLowerCase().includes(q),
      );
    }
    // Stage filter: show users who are AT one of the selected stages (OR across selections)
    // A user is "at stage X" if X is done AND the next milestone is NOT done
    if (activeFilters.size > 0) {
      r = r.filter(u =>
        FILTER_OPTIONS.some(opt =>
          activeFilters.has(opt.key) &&
          u[opt.key] === true &&
          (opt.notKey ? u[opt.notKey] === false : true),
        ),
      );
    }
    return r;
  }, [records, search, activeFilters]);

  const grouped = useMemo(() => {
    const map = new Map<string, UserRecord[]>();
    for (const u of filtered) {
      const key = getMonthKey(u.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }
    const sortedKeys = sortMonthKeys([...map.keys()]);
    return sortedKeys.map(k => ({ month: k, users: map.get(k)! }));
  }, [filtered]);

  const toggleMonth   = (month: string) => setOpenMonths(prev => {
    const next = new Set(prev);
    if (next.has(month)) next.delete(month); else next.add(month);
    return next;
  });
  const expandAll     = () => setOpenMonths(new Set(grouped.map(g => g.month)));
  const collapseAll   = () => setOpenMonths(new Set());

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Applications</h1>
          <p className={styles.description}>
            Filter applicants by milestone. Download the filtered list as CSV or Excel.
          </p>
        </div>
        <div className={styles.countPill}>
          <Users size={14} />
          {loading ? '…' : `${filtered.length} / ${records.length} interns`}
        </div>
      </header>

      {/* ── Checkbox Filters ── */}
      <div className={styles.filterPanel}>
        <div className={styles.filterTop}>
          <span className={styles.filterLabel}>Filter by milestone:</span>
          {activeFilters.size > 0 && (
            <button className={styles.clearBtn} onClick={clearFilters}>
              Clear filters ({activeFilters.size})
            </button>
          )}
        </div>
        <div className={styles.filterGrid}>
          {FILTER_OPTIONS.map(opt => {
            const checked = activeFilters.has(opt.key);
            return (
              <label key={opt.key} className={`${styles.filterChip} ${checked ? styles.filterChipOn : ''}`}>
                <input
                  type="checkbox"
                  className={styles.filterCheckbox}
                  checked={checked}
                  onChange={() => toggleFilter(opt.key)}
                />
                <span className={styles.filterChipLabel}>{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Search + Controls + Download ── */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name, email, domain or college…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.actionsRow}>
          {!loading && records.length > 0 && (
            <div className={styles.clusterControls}>
              <button className={styles.ctrlBtn} onClick={expandAll}>Expand all</button>
              <button className={styles.ctrlBtn} onClick={collapseAll}>Collapse all</button>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className={styles.downloadGroup}>
              <button
                className={styles.dlBtn}
                onClick={() => downloadCSV(filtered)}
                title={`Download ${filtered.length} records as CSV`}
              >
                <Download size={14} />
                CSV
              </button>
              <button
                className={`${styles.dlBtn} ${styles.dlBtnExcel}`}
                onClick={() => downloadExcel(filtered)}
                title={`Download ${filtered.length} records as Excel`}
              >
                <Download size={14} />
                Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spinner} />
          <p>Loading applications…</p>
        </div>
      )}
      {error && !loading && (
        <div className={`${styles.stateBox} ${styles.errorBox}`}>
          <AlertCircle size={22} /><p>{error}</p>
        </div>
      )}
      {!loading && !error && records.length === 0 && (
        <div className={styles.stateBox}>
          <FileText size={40} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No applications yet</p>
          <p className={styles.emptyHint}>Registered interns will appear here.</p>
        </div>
      )}
      {!loading && !error && records.length > 0 && filtered.length === 0 && (
        <div className={styles.stateBox}>
          <FileText size={30} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No results match the selected filters</p>
          <button className={styles.clearBtn} onClick={clearFilters} style={{ marginTop: 8 }}>
            Clear filters
          </button>
        </div>
      )}

      {/* ── Month Clusters ── */}
      {!loading && !error && grouped.length > 0 && (
        <div className={styles.clusters}>
          {grouped.map(({ month, users }) => {
            const isOpen = openMonths.has(month);
            const completedInCluster = users.filter(u => progressCount(u) === 7).length;

            return (
              <div key={month} className={styles.cluster}>
                <button
                  className={`${styles.clusterHead} ${isOpen ? styles.clusterHeadOpen : ''}`}
                  onClick={() => toggleMonth(month)}
                >
                  <div className={styles.clusterHeadLeft}>
                    <span className={styles.clusterChevron}>
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                    <Calendar size={16} className={styles.clusterIcon} />
                    <span className={styles.clusterMonth}>{month}</span>
                  </div>
                  <div className={styles.clusterHeadRight}>
                    <span className={styles.clusterBadge}>{users.length} applicant{users.length !== 1 ? 's' : ''}</span>
                    {completedInCluster > 0 && (
                      <span className={styles.clusterBadgeGreen}>{completedInCluster} completed</span>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className={styles.clusterBody}>
                    {/* Desktop table */}
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
                          {users.map(u => {
                            const done = progressCount(u);
                            const pct  = Math.round((done / 7) * 100);
                            return (
                              <tr key={u.id} className={styles.row}>
                                <td className={styles.tdStudent}>
                                  <p className={styles.studentName}>{u.name}</p>
                                  <p className={styles.studentEmail}>{u.email}</p>
                                  {u.mobile && <p className={styles.studentMobile}>{u.mobile}</p>}
                                </td>
                                <td className={styles.tdDomain}>
                                  <span className={styles.domainBadge}>{u.domain}</span>
                                </td>
                                <td className={styles.tdDomain}>
                                  <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                                    {u.college ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                                  </span>
                                </td>
                                <td className={styles.tdDate}>{fmtDate(u.createdAt)}</td>
                                <td className={styles.tdProgress}>
                                  <div className={styles.progRow}>
                                    <div className={styles.progTrack}>
                                      <div className={styles.progFill} style={{
                                        width: `${pct}%`,
                                        background: pct === 100 ? '#00b894' : pct >= 70 ? '#7c3aed' : '#3b82f6',
                                      }} />
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

                    {/* Mobile cards */}
                    <div className={styles.cardList}>
                      {users.map(u => {
                        const done = progressCount(u);
                        const pct  = Math.round((done / 7) * 100);
                        return (
                          <div key={u.id} className={styles.card}>
                            <div className={styles.cardTop}>
                              <div>
                                <p className={styles.cardName}>{u.name}</p>
                                <p className={styles.cardEmail}>{u.email}</p>
                                {u.mobile && <p className={styles.studentMobile}>{u.mobile}</p>}
                              </div>
                              <div className={styles.cardMeta}>
                                <span className={styles.domainBadge}>{u.domain}</span>
                                {u.college && <span style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{u.college}</span>}
                                <span style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{fmtDate(u.createdAt)}</span>
                              </div>
                            </div>
                            <div className={styles.cardProgRow}>
                              <div className={styles.progTrack} style={{ flex: 1 }}>
                                <div className={styles.progFill} style={{
                                  width: `${pct}%`,
                                  background: pct === 100 ? '#00b894' : pct >= 70 ? '#7c3aed' : '#3b82f6',
                                }} />
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Legend ── */}
      {!loading && records.length > 0 && (
        <div className={styles.legend}>
          <span className={styles.legendTitle}>Legend:</span>
          {STEPS.map((s, i) => (
            <span key={s.key} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: STEP_COLORS[i] }} />
              {s.label.replace('\n', ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
