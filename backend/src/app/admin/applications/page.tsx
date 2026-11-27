'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText, Loader2, AlertCircle, Search, Users,
  ChevronDown, ChevronRight, Calendar, Download, List,
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
  createdAt:  string | null;
  startDate:  string | null;
  endDate:    string | null;
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

const FILTER_OPTIONS: { key: StepKey; label: string; notKey?: StepKey }[] = [
  { key: 'linkedinVerified', label: 'LinkedIn Verified',    notKey: 'step1'            },
  { key: 'step1',            label: 'Step 1 Only',          notKey: 'step2'            },
  { key: 'step2',            label: 'Step 2 Only',          notKey: 'step3'            },
  { key: 'step3',            label: 'Step 3 Only',          notKey: 'step4'            },
  { key: 'step4',            label: 'Step 4 Only',          notKey: 'eCertPaid'        },
  { key: 'eCertPaid',        label: 'E-Certificate Only',   notKey: 'physicalCertPaid' },
  { key: 'physicalCertPaid', label: 'Physical Certificate'                             },
];

function isOnlyRegistered(u: UserRecord) {
  return (
    !u.linkedinVerified &&
    !u.step1 && !u.step2 && !u.step3 && !u.step4 &&
    !u.eCertPaid && !u.physicalCertPaid
  );
}

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

/* ── Registered time formatter (with time) ─────────────────────── */
function fmtDateTime(d: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── CSV / Excel download helpers ─────────────────────────────── */
function escCsv(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function downloadCSV(users: UserRecord[]) {
  const header = ['Name', 'Email', 'Mobile Number', 'Domain', 'College', 'Registered At'];
  const rows   = users.map(u => [
    u.name, u.email, u.mobile || '', u.domain, u.college || '', fmtDateTime(u.createdAt),
  ]);
  const csv    = [header, ...rows].map(r => r.map(escCsv).join(',')).join('\r\n');
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = 'skillinf_applicants.csv'; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(users: UserRecord[]) {
  const esc  = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cell = (v: string) => `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
  const row  = (cols: string[]) => `<Row>${cols.map(cell).join('')}</Row>`;

  const header   = ['Name', 'Email', 'Mobile Number', 'Domain', 'College', 'Registered At'];
  const dataRows = users.map(u => row([
    u.name, u.email, u.mobile || '', u.domain, u.college || '', fmtDateTime(u.createdAt),
  ]));
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

/* ── Shared user table row ─────────────────────────────────────── */
function UserRow({ u, showTime }: { u: UserRecord; showTime: boolean }) {
  const done = progressCount(u);
  const pct  = Math.round((done / 7) * 100);
  return (
    <tr className={styles.row}>
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
      <td className={styles.tdDate}>
        {showTime ? (
          <span style={{ fontSize: '0.76rem', lineHeight: 1.5 }}>
            <span style={{ display: 'block', fontWeight: 600, color: '#1e293b' }}>
              {fmtDate(u.createdAt)}
            </span>
            <span style={{ color: '#64748b' }}>
              {u.createdAt
                ? new Date(u.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
                  })
                : '—'}
            </span>
          </span>
        ) : fmtDate(u.createdAt)}
      </td>
      <td className={styles.tdDate}>
        {u.startDate ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', fontWeight: 700 }}>Start</span>
            <span className={styles.dateChipApp}>{fmtDate(u.startDate)}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', fontWeight: 700, marginTop: '4px' }}>End</span>
            <span className={styles.dateChipApp} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
              {u.endDate ? fmtDate(u.endDate) : '—'}
            </span>
          </span>
        ) : <span style={{ color: 'var(--secondary-text)' }}>—</span>}
      </td>
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
}

function TableHead() {
  return (
    <thead>
      <tr>
        <th className={styles.thStudent}>Student</th>
        <th className={styles.thDomain}>Domain</th>
        <th className={styles.thDomain}>College / University</th>
        <th className={styles.thJoined}>Registered</th>
        <th className={styles.thJoined} style={{ minWidth: '150px' }}>Internship Period</th>
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
  );
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

  // View mode: 'grouped' = month clusters, 'flat' = show all flat
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Checkbox milestone filters
  const [activeFilters,    setActiveFilters]    = useState<Set<StepKey>>(new Set());
  const [registeredFilter, setRegisteredFilter] = useState(false);

  // Extra filters for marketing analysis
  const [monthFilter,  setMonthFilter]  = useState('');   // e.g. "November 2026"
  const [domainFilter, setDomainFilter] = useState('');   // e.g. "Web Development"

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

  /* ── Derived option lists ── */
  const allMonths  = useMemo(() => sortMonthKeys([...new Set(records.map(u => getMonthKey(u.createdAt)))]), [records]);
  const allDomains = useMemo(() => [...new Set(records.map(u => u.domain))].sort(), [records]);

  const toggleFilter = (key: StepKey) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setRegisteredFilter(false);
    setMonthFilter('');
    setDomainFilter('');
  };

  const totalActiveFilterCount =
    activeFilters.size +
    (registeredFilter ? 1 : 0) +
    (monthFilter ? 1 : 0) +
    (domainFilter ? 1 : 0);

  /* ── Apply all filters ── */
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

    // Month filter
    if (monthFilter) {
      r = r.filter(u => getMonthKey(u.createdAt) === monthFilter);
    }

    // Domain filter
    if (domainFilter) {
      r = r.filter(u => u.domain === domainFilter);
    }

    // Milestone filter (OR logic)
    const hasStageFilter = activeFilters.size > 0 || registeredFilter;
    if (hasStageFilter) {
      r = r.filter(u => {
        if (registeredFilter && isOnlyRegistered(u)) return true;
        return FILTER_OPTIONS.some(opt =>
          activeFilters.has(opt.key) &&
          u[opt.key] === true &&
          (opt.notKey ? u[opt.notKey] === false : true),
        );
      });
    }

    return r;
  }, [records, search, activeFilters, registeredFilter, monthFilter, domainFilter]);

  /* ── Grouped (month clusters) ── */
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

  const toggleMonth = (month: string) => setOpenMonths(prev => {
    const next = new Set(prev);
    if (next.has(month)) next.delete(month); else next.add(month);
    return next;
  });
  const expandAll   = () => setOpenMonths(new Set(grouped.map(g => g.month)));
  const collapseAll = () => setOpenMonths(new Set());

  /* ── Summary stats for marketing panel ── */
  const stats = useMemo(() => ({
    total:         filtered.length,
    registered:    filtered.filter(isOnlyRegistered).length,
    liVerified:    filtered.filter(u => u.linkedinVerified).length,
    step1Done:     filtered.filter(u => u.step1).length,
    step2Done:     filtered.filter(u => u.step2).length,
    step3Done:     filtered.filter(u => u.step3).length,
    step4Done:     filtered.filter(u => u.step4).length,
    eCertPaid:     filtered.filter(u => u.eCertPaid).length,
    physicalPaid:  filtered.filter(u => u.physicalCertPaid).length,
  }), [filtered]);

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Applications</h1>
          <p className={styles.description}>
            Filter applicants by milestone, month, and domain. Download filtered list as CSV or Excel.
          </p>
        </div>
        <div className={styles.countPill}>
          <Users size={14} />
          {loading ? '…' : `${filtered.length} / ${records.length} interns`}
        </div>
      </header>

      {/* ── Milestone Checkbox Filters ── */}
      <div className={styles.filterPanel}>
        <div className={styles.filterTop}>
          <span className={styles.filterLabel}>Filter by milestone:</span>
          {totalActiveFilterCount > 0 && (
            <button className={styles.clearBtn} onClick={clearFilters}>
              Clear filters ({totalActiveFilterCount})
            </button>
          )}
        </div>
        <div className={styles.filterGrid}>
          <label className={`${styles.filterChip} ${styles.filterChipRegistered} ${registeredFilter ? styles.filterChipOn : ''}`}>
            <input
              type="checkbox"
              className={styles.filterCheckbox}
              checked={registeredFilter}
              onChange={() => setRegisteredFilter(p => !p)}
              id="filter-registered"
            />
            <span className={styles.filterChipLabel}>Registered</span>
          </label>

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

      {/* ── Marketing Filters Row: Month + Domain ── */}
      <div className={styles.marketingFilters}>
        <div className={styles.mfItem}>
          <label className={styles.mfLabel}>Month</label>
          <select
            className={styles.mfSelect}
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
          >
            <option value="">All months</option>
            {allMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className={styles.mfItem}>
          <label className={styles.mfLabel}>Domain</label>
          <select
            className={styles.mfSelect}
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
          >
            <option value="">All domains</option>
            {allDomains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div className={styles.mfItem} style={{ marginLeft: 'auto' }}>
          <label className={styles.mfLabel}>View</label>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'grouped' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('grouped')}
              title="Group by month"
            >
              <Calendar size={14} /> By Month
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'flat' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('flat')}
              title="Show all as flat list with registration time"
            >
              <List size={14} /> Show All
            </button>
          </div>
        </div>
      </div>

      {/* ── Marketing Summary Stats ── */}
      {!loading && filtered.length > 0 && (
        <div className={styles.statBar}>
          <div className={styles.statItem}><span className={styles.statNum}>{stats.total}</span><span className={styles.statLbl}>Total</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum} style={{ color: '#94a3b8' }}>{stats.registered}</span><span className={styles.statLbl}>Only Registered</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum} style={{ color: '#0a66c2' }}>{stats.liVerified}</span><span className={styles.statLbl}>LI Verified</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum} style={{ color: '#7c3aed' }}>{stats.step1Done}</span><span className={styles.statLbl}>Step 1</span></div>
          <div className={styles.statItem}><span className={styles.statNum} style={{ color: '#7c3aed' }}>{stats.step2Done}</span><span className={styles.statLbl}>Step 2</span></div>
          <div className={styles.statItem}><span className={styles.statNum} style={{ color: '#7c3aed' }}>{stats.step3Done}</span><span className={styles.statLbl}>Step 3</span></div>
          <div className={styles.statItem}><span className={styles.statNum} style={{ color: '#7c3aed' }}>{stats.step4Done}</span><span className={styles.statLbl}>Step 4</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum} style={{ color: '#00b894' }}>{stats.eCertPaid}</span><span className={styles.statLbl}>E-Cert Paid</span></div>
          <div className={styles.statItem}><span className={styles.statNum} style={{ color: '#f59e0b' }}>{stats.physicalPaid}</span><span className={styles.statLbl}>Physical Paid</span></div>
        </div>
      )}

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
          {!loading && records.length > 0 && viewMode === 'grouped' && (
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
                <Download size={14} /> CSV
              </button>
              <button
                className={`${styles.dlBtn} ${styles.dlBtnExcel}`}
                onClick={() => downloadExcel(filtered)}
                title={`Download ${filtered.length} records as Excel`}
              >
                <Download size={14} /> Excel
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

      {/* ══════════════════════════════════════════════════
          VIEW: FLAT — Show All (with registration time)
      ══════════════════════════════════════════════════ */}
      {!loading && !error && viewMode === 'flat' && filtered.length > 0 && (
        <div className={styles.clusters}>
          <div className={styles.cluster}>
            <div className={styles.clusterHead} style={{ cursor: 'default' }}>
              <div className={styles.clusterHeadLeft}>
                <List size={16} className={styles.clusterIcon} />
                <span className={styles.clusterMonth}>All Applicants</span>
              </div>
              <div className={styles.clusterHeadRight}>
                <span className={styles.clusterBadge}>{filtered.length} applicant{filtered.length !== 1 ? 's' : ''}</span>
                {monthFilter && <span className={styles.clusterBadgeGreen}>{monthFilter}</span>}
                {domainFilter && <span className={styles.clusterBadgeGreen}>{domainFilter}</span>}
              </div>
            </div>
            <div className={styles.clusterBody}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <TableHead />
                  <tbody>
                    {filtered.map(u => <UserRow key={u.id} u={u} showTime />)}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className={styles.cardList}>
                {filtered.map(u => {
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
                          <span style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{fmtDateTime(u.createdAt)}</span>
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
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          VIEW: GROUPED — By Month clusters
      ══════════════════════════════════════════════════ */}
      {!loading && !error && viewMode === 'grouped' && grouped.length > 0 && (
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
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <TableHead />
                        <tbody>
                          {users.map(u => <UserRow key={u.id} u={u} showTime={false} />)}
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
                                {u.startDate && (
                                  <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
                                    {fmtDate(u.startDate)} → {u.endDate ? fmtDate(u.endDate) : '—'}
                                  </span>
                                )}
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
