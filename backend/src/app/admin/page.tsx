'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, Link2, Award, Package,
  TrendingUp, RefreshCw, ArrowRight, CheckCircle,
  Clock, Loader2, BellOff, Bell, Settings, Power, AlertTriangle,
  Activity, BarChart3, IndianRupee, GraduationCap, FolderCheck,
  Mail, Ticket, Building2, MapPin, Share2, MessageCircle,
  Radio, Briefcase, Layers,
} from 'lucide-react';
import styles from './dashboard.module.css';

/* ── Types ────────────────────────────────────────────────────────────────── */
type RangeKey = '7d' | '30d' | '90d' | 'all';

interface Unread {
  registrations:   number;
  linkedinPending: number;
  eCertPending:    number;
  physicalCert:    number;
}

interface Totals {
  pendingLinkedin:       number;
  pendingProjectReviews: number;
  pendingECert:          number;
  pendingPhysical:       number;
  linkedinVerified:      number;
  certUnlocked:          number;
  eCertPaid:             number;
  physicalPaid:          number;
  onlyRegistered:        number;
  whatsappJoined:        number;
  referredUsers:         number;
  referredStep1:         number;
}

interface StepCompletion { step1: number; step2: number; step3: number; step4: number; }
interface LastRead {
  registrations: string; linkedinPending: string;
  eCertPending: string;  physicalCert: string;
}

interface Stats {
  totalUsers:       number;
  uniqueUsers:      number;
  rangeSignups:     number;
  prevRangeSignups: number | null;
  unread:           Unread;
  totals:           Totals;
  stepCompletion:   StepCompletion;
  lastRead:         LastRead;
}

interface RealtimePulse {
  signupsToday:      number;
  signupsYesterday:  number;
  signupsLast24h:    number;
  signupsLast7d:     number;
  signupsLast30d:    number;
  submissionsToday:  number;
  linkedinToday:     number;
  quizAttemptsToday: number;
  physicalToday:     number;
  emailsToday:       number;
}

interface RevenueData {
  eCertPrice:             number;
  eCertDiscount:          number;
  eCertNetPrice:          number;
  physicalCertPrice:      number;
  physicalCertDiscount:   number;
  physicalNetPrice:       number;
  eCertPaidCount:         number;
  physicalPaidCount:      number;
  estimatedCertRevenue:   number;
  checkoutPaymentsCount:  number;
  checkoutPaymentsAmount: number;
  offerCodesTotal:        number;
  offerCodesActive:       number;
  offerCodeRedemptions:   number;
  topOfferCodes: {
    code: string; label: string | null; discountPercent: number; usedCount: number; active: boolean;
  }[];
}

interface FunnelData {
  enrolled:       number;
  liVerified:     number;
  liPending:      number;
  step1:          number;
  step2:          number;
  step3:          number;
  step4:          number;
  eCertPaid:      number;
  certUnlocked:   number;
  physicalPaid:   number;
  whatsappJoined: number;
  referred:       number;
}

interface TimePoint {
  key:         string;
  label:       string;
  signups:     number;
  submissions: number;
}

interface DomainItem {
  domain:         string;
  total:          number;
  liVerified:     number;
  step1:          number;
  step4:          number;
  eCertPaid:      number;
  physicalPaid:   number;
  completionRate: number;
}

interface QuizAnalytics {
  uniqueStudentsAttempted: number;
  totalAttempts:           number;
  attemptsToday:           number;
  passedCount:             number;
  failedCount:             number;
  passRate:                number;
  avgScore:                number;
  byWeek: {
    week:       number;
    usersTried: number;
    attempts:   number;
    passed:     number;
    failed:     number;
    avgScore:   number;
    passRate:   number;
  }[];
}

interface ProjectReviewsSummary {
  total:          number;
  pending:        number;
  approved:       number;
  rejected:       number;
  todaySubmitted: number;
  pendingByStep: {
    step1: number; step2: number; step3: number; step4: number;
  };
}

interface AudienceBreakdown {
  topColleges:      { college: string; count: number; eCertPaid: number }[];
  topDistricts:     { district: string; count: number }[];
  withCollegeCount: number;
  collegeTotal:     number;
}

interface EmailStatus {
  totalAll:     number;
  totalToday:   number;
  totalMonth:   number;
  dailyLimit:   number;
  monthlyLimit: number;
}

interface CatalogHealth {
  domainsCount:            number;
  companyInternshipsCount: number;
  batchesCount:            number;
  openCareersCount:        number;
  totalCareersCount:       number;
  eventCertsCount:         number;
  eventCertDownloadsCount: number;
  programsCount:           number;
  projectsCount:           number;
}

interface RecentReg {
  id:               string;
  name:             string;
  email:            string;
  domain:           string;
  college:          string | null;
  createdAt:        string;
  linkedinVerified: boolean | 'pending';
  stepsDone:        number;
  eCertPaid:        boolean;
}

interface ActivityItem {
  id:     string;
  type:   'signup' | 'project' | 'linkedin' | 'physical' | 'quiz';
  title:  string;
  detail: string;
  domain: string;
  status: string;
  at:     string;
}

interface DashboardResponse {
  success:               boolean;
  meta:                  { serverTime: string; istDate: string; range: RangeKey; queryMs: number };
  realtimePulse:         RealtimePulse;
  stats:                 Stats;
  revenue:               RevenueData;
  funnel:                FunnelData;
  timeSeries:            { granularity: 'day' | 'month'; points: TimePoint[] };
  domainBreakdown:       DomainItem[];
  quizAnalytics:         QuizAnalytics;
  projectReviewsSummary: ProjectReviewsSummary;
  audienceBreakdown:     AudienceBreakdown;
  emailStatus:           EmailStatus;
  catalogHealth:         CatalogHealth;
  recentRegistrations:   RecentReg[];
  liveActivity:          ActivityItem[];
}

interface SiteSettings {
  maintenanceMode:    boolean;
  maintenanceMessage: string;
}

/* ── Formatters ───────────────────────────────────────────────────────────── */
const RANGE_LABELS: Record<RangeKey, string> = {
  '7d':  'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  all:   'All Time',
};

function fmtNum(n: number): string {
  return n.toLocaleString('en-IN');
}

function fmtInr(n: number): string {
  return 'Rs. ' + n.toLocaleString('en-IN');
}

function fmtPct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 100);
}

function fmtDateIst(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getTime() === 0) return '—';
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtRelativeTime(iso: string, nowMs: number): string {
  const t = new Date(iso).getTime();
  if (isNaN(t) || t === 0) return '—';
  const diffSec = Math.max(0, Math.floor((nowMs - t) / 1000));
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return fmtDateIst(iso);
}

async function markRead(categories: string[]) {
  await fetch('/api/admin/dashboard-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories }),
  });
}

/* ── Alert Card ───────────────────────────────────────────────────────────── */
function AlertCard({
  icon, title, total, unread, desc, href, color, onRead,
}: {
  icon: React.ReactNode; title: string;
  total: number; unread?: number;
  desc: string; href: string; color: string;
  onRead?: () => void;
}) {
  if (total === 0) return null;
  return (
    <div className={styles.alertCard} style={{ '--accent': color } as React.CSSProperties}>
      <Link href={href} className={styles.alertCardInner}>
        <div className={styles.alertIconWrap}>{icon}</div>
        <div className={styles.alertBody}>
          <p className={styles.alertTitle}>{title}</p>
          <p className={styles.alertDesc}>{desc}</p>
        </div>
        <div className={styles.alertRight}>
          <span className={styles.alertTotal}>{fmtNum(total)}</span>
          {unread !== undefined && unread > 0 && (
            <span className={styles.alertUnread} style={{ background: color }}>
              {unread} new
            </span>
          )}
        </div>
      </Link>
      {unread !== undefined && unread > 0 && onRead && (
        <button className={styles.markReadBtn} onClick={onRead} title="Mark as read">
          <BellOff size={13} /> Mark read
        </button>
      )}
    </div>
  );
}

/* ── KPI Stat Card ────────────────────────────────────────────────────────── */
function KpiCard({
  icon, label, value, sub, badge, badgePositive, href, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  badge?: string | null;
  badgePositive?: boolean | null;
  href?: string;
  color: string;
}) {
  return (
    <div className={styles.statCard} style={{ '--accent': color } as React.CSSProperties}>
      <div className={styles.statTopRow}>
        <div className={styles.statIcon}>{icon}</div>
        {badge && (
          <span
            className={`${styles.kpiDeltaBadge} ${
              badgePositive === true
                ? styles.deltaPos
                : badgePositive === false
                  ? styles.deltaNeg
                  : styles.deltaNeutral
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className={styles.statBody}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statSub}>{sub}</p>
      </div>
      {href && (
        <Link href={href} className={styles.statLink} aria-label={`Go to ${label}`}>
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

/* ── Interactive SVG Trend Chart (Enrollments vs Project Submissions) ─────── */
function TrendChart({
  points,
  granularity,
  range,
}: {
  points: TimePoint[];
  granularity: 'day' | 'month';
  range: RangeKey;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Enrollment &amp; Submission Activity</h3>
            <p className={styles.panelSub}>No dated records available in {RANGE_LABELS[range]}</p>
          </div>
        </div>
        <div className={styles.chartEmpty}>No activity recorded for this time window yet.</div>
      </div>
    );
  }

  const totalSignups = points.reduce((s, p) => s + p.signups, 0);
  const totalSubs = points.reduce((s, p) => s + p.submissions, 0);
  const avgSignups = points.length > 0 ? (totalSignups / points.length).toFixed(1) : '0';
  const peakPoint = points.reduce((best, p) => (p.signups >= best.signups ? p : best), points[0]);

  const W = 820;
  const H = 240;
  const PAD_L = 38;
  const PAD_R = 16;
  const PAD_T = 18;
  const PAD_B = 30;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const rawMax = Math.max(...points.map((p) => Math.max(p.signups, p.submissions)), 0);
  const yMax = Math.max(4, Math.ceil(rawMax * 1.15));
  const yTicks = [0, Math.round(yMax / 2), yMax];

  const slotW = plotW / points.length;
  const barW = Math.max(4, Math.min(26, slotW * 0.62));

  const xCenter = (i: number) => PAD_L + i * slotW + slotW / 2;
  const yPos = (val: number) => PAD_T + plotH - (val / yMax) * plotH;

  const linePoints = points.map((p, i) => `${xCenter(i).toFixed(1)},${yPos(p.submissions).toFixed(1)}`).join(' ');
  const labelStride = points.length <= 10 ? 1 : points.length <= 31 ? 5 : Math.ceil(points.length / 8);

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            <BarChart3 size={16} className={styles.panelTitleIcon} />
            Enrollment &amp; Submission Velocity ({RANGE_LABELS[range]})
          </h3>
          <p className={styles.panelSub}>
            Grouped by IST {granularity === 'day' ? 'day' : 'month'} &nbsp;&bull;&nbsp; Avg{' '}
            <strong>{avgSignups}</strong> enrollments/{granularity} &nbsp;&bull;&nbsp; Peak{' '}
            <strong>{peakPoint.signups}</strong> on {peakPoint.label}
          </p>
        </div>

        <div className={styles.chartMetaRight}>
          <div className={styles.chartSummaryPills}>
            <span className={styles.chartPillSignups}>
              <span className={styles.legendSw} style={{ background: '#3F5F54' }} />
              {fmtNum(totalSignups)} Enrollments
            </span>
            <span className={styles.chartPillSubs}>
              <span className={styles.legendSw} style={{ background: '#7c3aed' }} />
              {fmtNum(totalSubs)} Submissions
            </span>
          </div>
        </div>
      </div>

      <div className={styles.chartBox} onMouseLeave={() => setHoverIdx(null)}>
        {hovered && hoverIdx !== null && (
          <div
            className={styles.chartTooltip}
            style={{
              left: `${Math.min(82, Math.max(8, ((hoverIdx + 0.5) / points.length) * 100))}%`,
            }}
          >
            <p className={styles.ttDate}>{hovered.label} ({hovered.key})</p>
            <p className={styles.ttRow}>
              <span className={styles.ttDot} style={{ background: '#3F5F54' }} />
              Enrollments: <strong>{hovered.signups}</strong>
            </p>
            <p className={styles.ttRow}>
              <span className={styles.ttDot} style={{ background: '#7c3aed' }} />
              Project submissions: <strong>{hovered.submissions}</strong>
            </p>
          </div>
        )}

        <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} role="img" aria-label="Enrollments and project submissions trend">
          {/* Horizontal grid lines */}
          {yTicks.map((tick) => {
            const y = yPos(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="#E2E9E5"
                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                  strokeWidth={1}
                />
                <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#66736D">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Hover vertical highlight column */}
          {hoverIdx !== null && (
            <rect
              x={PAD_L + hoverIdx * slotW}
              y={PAD_T}
              width={slotW}
              height={plotH}
              fill="rgba(107, 144, 128, 0.08)"
              rx={4}
            />
          )}

          {/* Signups bars */}
          {points.map((p, i) => {
            const bh = (p.signups / yMax) * plotH;
            const bx = xCenter(i) - barW / 2;
            const by = PAD_T + plotH - bh;
            const isHover = hoverIdx === i;
            return (
              <rect
                key={p.key}
                x={bx}
                y={by}
                width={barW}
                height={Math.max(bh, p.signups > 0 ? 3 : 0)}
                rx={Math.min(4, barW / 2)}
                fill={isHover ? '#2b473e' : '#6B9080'}
                opacity={hoverIdx !== null && !isHover ? 0.55 : 0.92}
              />
            );
          })}

          {/* Project submissions polyline */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#7c3aed"
              strokeWidth={2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={linePoints}
            />
          )}

          {/* Submission nodes */}
          {points.map((p, i) => {
            const cx = xCenter(i);
            const cy = yPos(p.submissions);
            const isHover = hoverIdx === i;
            if (points.length > 35 && !isHover && p.submissions === 0) return null;
            return (
              <circle
                key={`dot-${p.key}`}
                cx={cx}
                cy={cy}
                r={isHover ? 5 : points.length > 40 ? 2.5 : 3.5}
                fill={isHover ? '#7c3aed' : '#fff'}
                stroke="#7c3aed"
                strokeWidth={2}
              />
            );
          })}

          {/* X axis labels */}
          {points.map((p, i) => {
            const show = i === 0 || i === points.length - 1 || i % labelStride === 0;
            if (!show) return null;
            return (
              <text
                key={`lbl-${p.key}`}
                x={xCenter(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="10.5"
                fill="#66736D"
              >
                {p.label}
              </text>
            );
          })}

          {/* Transparent hover hit regions */}
          {points.map((p, i) => (
            <rect
              key={`hit-${p.key}`}
              x={PAD_L + i * slotW}
              y={PAD_T}
              width={slotW}
              height={plotH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoverIdx(i)}
              onClick={() => setHoverIdx(i)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [data,        setData]        = useState<DashboardResponse | null>(null);
  const [range,       setRange]       = useState<RangeKey>('30d');
  const [pollMs,      setPollMs]      = useState<number>(15_000); // 15s default live polling
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nowMs,       setNowMs]       = useState<number>(() => Date.now());

  /* ── System Settings state ── */
  const [settings,     setSettings]     = useState<SiteSettings>({ maintenanceMode: false, maintenanceMessage: '' });
  const [settingsLoad, setSettingsLoad] = useState(true);
  const [settingsSave, setSettingsSave] = useState(false);
  const [settingsMsg,  setSettingsMsg]  = useState<{ ok: boolean; text: string } | null>(null);

  const rangeRef = useRef<RangeKey>(range);
  useEffect(() => { rangeRef.current = range; }, [range]);

  const fetchStats = useCallback(async (rKey: RangeKey) => {
    try {
      const res = await fetch(`/api/admin/dashboard-stats?range=${rKey}`, {
        cache: 'no-store',
      });
      const json = (await res.json()) as DashboardResponse & { message?: string };
      if (json.success) {
        setData(json);
        setError('');
        const now = new Date();
        setLastRefresh(now);
        setNowMs(now.getTime());
      } else {
        setError(json.message || 'Failed to load analytics.');
      }
    } catch {
      setError('Network error syncing real-time analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshNow = useCallback(async (rKey?: RangeKey) => {
    setRefreshing(true);
    await fetchStats(rKey ?? rangeRef.current);
  }, [fetchStats]);

  /* Initial fetch + whenever timeframe changes (setState only after await) */
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/dashboard-stats?range=${range}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: DashboardResponse & { message?: string }) => {
        if (!active) return;
        if (json.success) {
          setData(json);
          setError('');
          const now = new Date();
          setLastRefresh(now);
          setNowMs(now.getTime());
        } else {
          setError(json.message || 'Failed to load analytics.');
        }
      })
      .catch(() => {
        if (active) setError('Network error syncing real-time analytics.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => { active = false; };
  }, [range]);

  /* Live 1-second ticker for "synced Xs ago" and relative timestamps */
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Tab-visibility-aware real-time auto polling */
  useEffect(() => {
    if (pollMs <= 0) return;

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchStats(rangeRef.current);
      }
    };

    const intervalId = setInterval(tick, pollMs);
    const onVisChange = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [pollMs, fetchStats]);

  /* Load site settings once (setState only inside async callbacks) */
  useEffect(() => {
    let active = true;
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success) setSettings(d.settings);
      })
      .catch(() => {/* silent */})
      .finally(() => {
        if (active) setSettingsLoad(false);
      });
    return () => { active = false; };
  }, []);

  const saveSettings = async (patch: Partial<SiteSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSettingsSave(true);
    setSettingsMsg(null);
    try {
      const r = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const d = await r.json();
      setSettingsMsg({ ok: d.success, text: d.success ? 'Settings saved.' : (d.message || 'Failed.') });
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch {
      setSettingsMsg({ ok: false, text: 'Network error.' });
    } finally {
      setSettingsSave(false);
    }
  };

  const markAndReload = async (cats: string[]) => {
    await markRead(cats);
    await refreshNow(range);
  };

  const markAllRead = () =>
    markAndReload(['registrations', 'linkedinPending', 'eCertPending', 'physicalCert']);

  const syncedAgoSec = lastRefresh ? Math.max(0, Math.floor((nowMs - lastRefresh.getTime()) / 1000)) : null;

  const stats = data?.stats;
  const totalUnread = stats
    ? stats.unread.registrations + stats.unread.linkedinPending +
      stats.unread.eCertPending  + stats.unread.physicalCert
    : 0;

  const totalActionNeeded = stats
    ? stats.totals.pendingLinkedin +
      stats.totals.pendingProjectReviews +
      stats.totals.pendingECert +
      stats.totals.pendingPhysical
    : 0;

  /* Growth delta helper */
  let growthLabel: string | null = null;
  let growthPos: boolean | null = null;
  if (stats && stats.prevRangeSignups !== null) {
    if (stats.prevRangeSignups === 0 && stats.rangeSignups > 0) {
      growthLabel = `+${stats.rangeSignups} new`;
      growthPos = true;
    } else if (stats.prevRangeSignups > 0) {
      const pctDiff = Math.round(((stats.rangeSignups - stats.prevRangeSignups) / stats.prevRangeSignups) * 100);
      growthLabel = `${pctDiff >= 0 ? '+' : ''}${pctDiff}% vs prev`;
      growthPos = pctDiff >= 0;
    } else {
      growthLabel = '0 change';
      growthPos = null;
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Header + Live Controls ─────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Real-Time Analytics</h1>
            <span className={`${styles.livePill} ${pollMs > 0 ? styles.livePillOn : styles.livePillPaused}`}>
              <Radio size={12} className={pollMs > 0 ? styles.livePulseIcon : ''} />
              {pollMs > 0 ? `LIVE (${pollMs / 1000}s)` : 'PAUSED'}
            </span>
            {totalUnread > 0 && (
              <span className={styles.unreadDot}>
                <Bell size={12} /> {totalUnread} unread
              </span>
            )}
          </div>
          <p className={styles.desc}>
            {lastRefresh ? (
              <>
                Synced {syncedAgoSec === 0 ? 'just now' : `${syncedAgoSec}s ago`}
                {' · '}
                {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                {data?.meta && ` · IST ${data.meta.istDate} · DB ${data.meta.queryMs}ms`}
              </>
            ) : 'Connecting to live MongoDB telemetry…'}
          </p>
        </div>

        <div className={styles.headerControls}>
          {/* Timeframe tabs */}
          <div className={styles.rangeTabs} role="group" aria-label="Analytics timeframe">
            {(['7d', '30d', '90d', 'all'] as const).map((rk) => (
              <button
                key={rk}
                className={`${styles.rangeTab} ${range === rk ? styles.rangeTabActive : ''}`}
                onClick={() => {
                  if (rk !== range) setRefreshing(true);
                  setRange(rk);
                }}
              >
                {rk === 'all' ? 'All' : rk.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Polling interval */}
          <select
            className={styles.pollSelect}
            value={pollMs}
            onChange={(e) => setPollMs(Number(e.target.value))}
            aria-label="Auto-refresh interval"
          >
            <option value={15000}>Auto: 15s</option>
            <option value={30000}>Auto: 30s</option>
            <option value={60000}>Auto: 60s</option>
            <option value={0}>Auto: Off</option>
          </select>

          {totalUnread > 0 && (
            <button className={styles.markAllBtn} onClick={markAllRead} disabled={refreshing} id="mark-all-read-btn">
              <BellOff size={14} /> Mark all read
            </button>
          )}
          <button
            className={styles.refreshBtn}
            onClick={() => refreshNow(range)}
            disabled={loading || refreshing}
            id="refresh-dashboard-btn"
          >
            {refreshing ? <Loader2 size={15} className={styles.spin} /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className={styles.loadBox}>
          <Loader2 size={28} className={styles.spin} />
          <span>Loading live MongoDB analytics…</span>
        </div>
      )}

      {data && stats && (
        <>
          {/* ── Unread / Status Strip ──────────────────────────────────── */}
          {totalUnread > 0 ? (
            <div className={styles.unreadStrip}>
              <Bell size={16} className={styles.stripBell} />
              <span>
                You have <strong>{totalUnread}</strong> unread item{totalUnread !== 1 ? 's' : ''} since your last check.
                Click <strong>Mark all read</strong> once reviewed.
              </span>
            </div>
          ) : (
            <div className={styles.allReadStrip}>
              <CheckCircle size={15} />
              <span>All caught up — no unread alerts since your last visit.</span>
            </div>
          )}

          {/* ── Live Today Velocity Strip ──────────────────────────────── */}
          <section className={styles.pulseBar}>
            <div className={styles.pulseHeader}>
              <Activity size={15} />
              <span>TODAY&apos;S LIVE PULSE (IST {data.meta.istDate})</span>
            </div>
            <div className={styles.pulseGrid}>
              <div className={styles.pulseItem}>
                <span className={styles.pulseNum}>{fmtNum(data.realtimePulse.signupsToday)}</span>
                <span className={styles.pulseLbl}>Signups Today</span>
                <span className={styles.pulseHint}>
                  Yesterday: {fmtNum(data.realtimePulse.signupsYesterday)}
                </span>
              </div>
              <div className={styles.pulseItem}>
                <span className={styles.pulseNum}>{fmtNum(data.realtimePulse.signupsLast24h)}</span>
                <span className={styles.pulseLbl}>Last 24h</span>
                <span className={styles.pulseHint}>
                  7d: {fmtNum(data.realtimePulse.signupsLast7d)}
                </span>
              </div>
              <div className={styles.pulseItem}>
                <span className={styles.pulseNum}>{fmtNum(data.realtimePulse.submissionsToday)}</span>
                <span className={styles.pulseLbl}>Projects Today</span>
                <span className={styles.pulseHint}>
                  Pending queue: {fmtNum(data.projectReviewsSummary.pending)}
                </span>
              </div>
              <div className={styles.pulseItem}>
                <span className={styles.pulseNum}>{fmtNum(data.realtimePulse.linkedinToday)}</span>
                <span className={styles.pulseLbl}>LinkedIn Today</span>
                <span className={styles.pulseHint}>
                  Pending: {fmtNum(stats.totals.pendingLinkedin)}
                </span>
              </div>
              <div className={styles.pulseItem}>
                <span className={styles.pulseNum}>{fmtNum(data.realtimePulse.quizAttemptsToday)}</span>
                <span className={styles.pulseLbl}>Quizzes Today</span>
                <span className={styles.pulseHint}>
                  Pass rate: {data.quizAnalytics.passRate}%
                </span>
              </div>
              <div className={styles.pulseItem}>
                <span className={styles.pulseNum}>{fmtNum(data.realtimePulse.physicalToday)}</span>
                <span className={styles.pulseLbl}>Physical Orders Today</span>
                <span className={styles.pulseHint}>
                  Emails today: {data.realtimePulse.emailsToday}/{data.emailStatus.dailyLimit}
                </span>
              </div>
            </div>
          </section>

          {/* ── Action Needed Queue ────────────────────────────────────── */}
          {totalActionNeeded > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionDot} style={{ background: '#ef4444' }} />
                Action Needed
                <span className={styles.sectionCount}>{fmtNum(totalActionNeeded)}</span>
              </h2>
              <div className={styles.alertsGrid}>
                <AlertCard
                  icon={<Link2 size={20} />}
                  title="LinkedIn Verifications"
                  total={stats.totals.pendingLinkedin}
                  unread={stats.unread.linkedinPending}
                  desc="Students awaiting LinkedIn post approval"
                  href="/admin/linkedin-verify"
                  color="#0a66c2"
                  onRead={() => markAndReload(['linkedinPending'])}
                />
                <AlertCard
                  icon={<FolderCheck size={20} />}
                  title="Project Reviews Pending"
                  total={stats.totals.pendingProjectReviews}
                  desc={`S1: ${data.projectReviewsSummary.pendingByStep.step1} · S2: ${data.projectReviewsSummary.pendingByStep.step2} · S3: ${data.projectReviewsSummary.pendingByStep.step3} · S4: ${data.projectReviewsSummary.pendingByStep.step4}`}
                  href="/admin/linkedin-verify"
                  color="#d97706"
                />
                <AlertCard
                  icon={<Award size={20} />}
                  title="E-Certificates to Issue"
                  total={stats.totals.pendingECert}
                  unread={stats.unread.eCertPending}
                  desc="Paid but certificate not yet unlocked"
                  href="/admin/e-certificate"
                  color="#7c3aed"
                  onRead={() => markAndReload(['eCertPending'])}
                />
                <AlertCard
                  icon={<Package size={20} />}
                  title="Physical Certificates"
                  total={stats.totals.pendingPhysical}
                  unread={stats.unread.physicalCert}
                  desc="Paid physical certificates for dispatch"
                  href="/admin/physical-certificates"
                  color="#f59e0b"
                  onRead={() => markAndReload(['physicalCert'])}
                />
              </div>
            </section>
          )}

          {/* ── Primary KPI Overview Cards ─────────────────────────────── */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: '#10b981' }} />
              Live Overview
              <span className={styles.sectionSub}>{RANGE_LABELS[range]} highlighted</span>
            </h2>
            <div className={styles.statsGrid}>
              <KpiCard
                icon={<Users size={21} />}
                label="Total Enrollments"
                value={fmtNum(stats.totalUsers)}
                sub={`${fmtNum(stats.uniqueUsers)} unique emails · ${fmtNum(stats.rangeSignups)} in range`}
                badge={growthLabel}
                badgePositive={growthPos}
                href="/admin/applications"
                color="#3b82f6"
              />
              <KpiCard
                icon={<Link2 size={21} />}
                label="LinkedIn Verified"
                value={fmtNum(stats.totals.linkedinVerified)}
                sub={`${fmtPct(stats.totals.linkedinVerified, stats.totalUsers)}% of enrollments · ${stats.totals.pendingLinkedin} pending`}
                badge={stats.unread.registrations > 0 ? `+${stats.unread.registrations} new` : null}
                badgePositive={true}
                href="/admin/linkedin-verify"
                color="#0a66c2"
              />
              <KpiCard
                icon={<Award size={21} />}
                label="Certificates Paid"
                value={fmtNum(stats.totals.eCertPaid)}
                sub={`${fmtNum(stats.totals.certUnlocked)} unlocked · ${fmtNum(stats.totals.physicalPaid)} physical`}
                badge={`${fmtPct(stats.totals.eCertPaid, stats.totalUsers)}% conv.`}
                badgePositive={null}
                href="/admin/e-certificate"
                color="#7c3aed"
              />
              <KpiCard
                icon={<IndianRupee size={21} />}
                label="Est. Cert Revenue"
                value={fmtInr(data.revenue.estimatedCertRevenue)}
                sub={`${data.revenue.eCertPaidCount}×₹${data.revenue.eCertNetPrice} + ${data.revenue.physicalPaidCount}×₹${data.revenue.physicalNetPrice}${
                  data.revenue.checkoutPaymentsCount > 0
                    ? ` · Checkout: ${fmtInr(data.revenue.checkoutPaymentsAmount)}`
                    : ''
                }`}
                badge={`${data.revenue.offerCodeRedemptions} promo uses`}
                badgePositive={true}
                href="/admin/payments"
                color="#059669"
              />
              <KpiCard
                icon={<GraduationCap size={21} />}
                label="Quiz Pass Rate"
                value={`${data.quizAnalytics.passRate}%`}
                sub={`${fmtNum(data.quizAnalytics.totalAttempts)} attempts · ${data.quizAnalytics.avgScore}% avg score`}
                badge={`${fmtNum(data.quizAnalytics.uniqueStudentsAttempted)} students`}
                badgePositive={data.quizAnalytics.passRate >= 60}
                color="#6B9080"
              />
              <KpiCard
                icon={<Share2 size={21} />}
                label="Referrals & Community"
                value={fmtNum(stats.totals.referredUsers)}
                sub={`${fmtNum(stats.totals.referredStep1)} reached Step 1 · ${fmtPct(stats.totals.whatsappJoined, stats.totalUsers)}% WhatsApp`}
                badge={`${fmtPct(stats.totals.referredUsers, stats.totalUsers)}% referred`}
                badgePositive={null}
                href="/admin/referrals"
                color="#f59e0b"
              />
            </div>
          </section>

          {/* ── Time-Series Trend Chart ─────────────────────────────────── */}
          <section>
            <TrendChart
              points={data.timeSeries.points}
              granularity={data.timeSeries.granularity}
              range={range}
            />
          </section>

          {/* ── Row 1: Conversion Funnel + Domain Performance ──────────── */}
          <section className={styles.twoColGrid}>
            {/* Student Lifecycle Funnel */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Student Conversion Funnel</h3>
                  <p className={styles.panelSub}>
                    Drop-off across milestones ({RANGE_LABELS[range]} cohort: {fmtNum(data.funnel.enrolled)})
                  </p>
                </div>
              </div>
              <div className={styles.funnelList}>
                {([
                  { label: 'Enrolled',          val: data.funnel.enrolled,     color: '#3b82f6' },
                  { label: 'LinkedIn Verified', val: data.funnel.liVerified,   color: '#0a66c2' },
                  { label: 'Step 1 Approved',   val: data.funnel.step1,        color: '#6366f1' },
                  { label: 'Step 2 Approved',   val: data.funnel.step2,        color: '#7c3aed' },
                  { label: 'Step 3 Approved',   val: data.funnel.step3,        color: '#8b5cf6' },
                  { label: 'Step 4 Approved',   val: data.funnel.step4,        color: '#6B9080' },
                  { label: 'E-Cert Paid',       val: data.funnel.eCertPaid,    color: '#00b894' },
                  { label: 'Physical Ordered',  val: data.funnel.physicalPaid, color: '#f59e0b' },
                ] as const).map((stage, idx, arr) => {
                  const pctOfTotal = fmtPct(stage.val, data.funnel.enrolled);
                  const prevVal = idx > 0 ? arr[idx - 1].val : stage.val;
                  const stepRet = idx > 0 ? fmtPct(stage.val, prevVal) : 100;
                  return (
                    <div key={stage.label} className={styles.funnelRow}>
                      <div className={styles.funnelMeta}>
                        <span className={styles.funnelName}>{stage.label}</span>
                        <span className={styles.funnelNums}>
                          <strong>{fmtNum(stage.val)}</strong>
                          <span className={styles.funnelPct}>{pctOfTotal}%</span>
                          {idx > 0 && (
                            <span className={styles.funnelStepRet} title="Conversion from previous stage">
                              ({stepRet}% step)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className={styles.funnelTrack}>
                        <div
                          className={styles.funnelFill}
                          style={{ width: `${Math.max(stage.val > 0 ? 3 : 0, pctOfTotal)}%`, background: stage.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.funnelFooter}>
                <span>
                  <MessageCircle size={13} /> WhatsApp Joined:{' '}
                  <strong>{fmtNum(data.funnel.whatsappJoined)}</strong> ({fmtPct(data.funnel.whatsappJoined, data.funnel.enrolled)}%)
                </span>
                <span>
                  <UserPlus size={13} /> Only Registered (no action yet):{' '}
                  <strong>{fmtNum(stats.totals.onlyRegistered)}</strong>
                </span>
              </div>
            </div>

            {/* Domain Breakdown */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Domain Breakdown</h3>
                  <p className={styles.panelSub}>
                    {data.domainBreakdown.length} active domain{data.domainBreakdown.length !== 1 ? 's' : ''} ({RANGE_LABELS[range]})
                  </p>
                </div>
                <Link href="/admin/applications" className={styles.viewAll}>
                  All interns <ArrowRight size={13} />
                </Link>
              </div>
              {data.domainBreakdown.length === 0 ? (
                <div className={styles.emptySmall}>No enrollments in this range.</div>
              ) : (
                <div className={styles.domainList}>
                  {data.domainBreakdown.map((d) => {
                    const maxDomain = data.domainBreakdown[0]?.total || 1;
                    const barPct = fmtPct(d.total, maxDomain);
                    return (
                      <div key={d.domain} className={styles.domainRow}>
                        <div className={styles.domainTop}>
                          <span className={styles.domainName}>{d.domain}</span>
                          <span className={styles.domainCounts}>
                            <strong>{fmtNum(d.total)}</strong> enrolled &middot;{' '}
                            <span style={{ color: '#0a66c2' }}>{d.liVerified} LI</span> &middot;{' '}
                            <span style={{ color: '#059669' }}>{d.eCertPaid} paid</span> ({d.completionRate}% done)
                          </span>
                        </div>
                        <div className={styles.domainTrack}>
                          <div className={styles.domainFill} style={{ width: `${Math.max(4, barPct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ── Row 2: Quiz Analytics + Operations / Email / Offer Codes ── */}
          <section className={styles.twoColGrid}>
            {/* Quiz Analytics */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Week-by-Week Quiz Performance</h3>
                  <p className={styles.panelSub}>Live pass/fail telemetry from user quiz records</p>
                </div>
              </div>
              <div className={styles.quizSummaryStrip}>
                <div>
                  <span className={styles.qsNum}>{fmtNum(data.quizAnalytics.totalAttempts)}</span>
                  <span className={styles.qsLbl}>Total Attempts</span>
                </div>
                <div>
                  <span className={styles.qsNum} style={{ color: '#10b981' }}>{fmtNum(data.quizAnalytics.passedCount)}</span>
                  <span className={styles.qsLbl}>Passed Weeks</span>
                </div>
                <div>
                  <span className={styles.qsNum} style={{ color: '#ef4444' }}>{fmtNum(data.quizAnalytics.failedCount)}</span>
                  <span className={styles.qsLbl}>Not Yet Passed</span>
                </div>
                <div>
                  <span className={styles.qsNum}>{data.quizAnalytics.avgScore}%</span>
                  <span className={styles.qsLbl}>Avg Score</span>
                </div>
              </div>

              <div className={styles.quizWeekGrid}>
                {data.quizAnalytics.byWeek.map((w) => (
                  <div key={w.week} className={styles.quizWeekRow}>
                    <div className={styles.quizWeekLeft}>
                      <span className={styles.quizWeekTag}>Week {w.week}</span>
                      <span className={styles.quizWeekMeta}>
                        {w.usersTried} students &middot; {w.attempts} attempts &middot; avg {w.avgScore}%
                      </span>
                    </div>
                    <div className={styles.quizWeekRight}>
                      <div className={styles.quizSplitTrack}>
                        <div
                          className={styles.quizSplitPass}
                          style={{ width: `${w.passRate}%` }}
                          title={`${w.passed} passed (${w.passRate}%)`}
                        />
                      </div>
                      <span className={styles.quizPassPct}>{w.passRate}% pass</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Reviews, Email Quota & Offer Codes */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Operations, Email &amp; Promo Codes</h3>
                  <p className={styles.panelSub}>Live queue status, Resend quota &amp; discounts</p>
                </div>
              </div>

              {/* Project Reviews Bar */}
              <div className={styles.opBlock}>
                <div className={styles.opTop}>
                  <span className={styles.opLabel}>Project Reviews ({fmtNum(data.projectReviewsSummary.total)})</span>
                  <Link href="/admin/linkedin-verify" className={styles.viewAll}>Review queue <ArrowRight size={12} /></Link>
                </div>
                <div className={styles.opBadges}>
                  <span className={`${styles.opBadge} ${styles.opPend}`}>
                    {data.projectReviewsSummary.pending} Pending
                  </span>
                  <span className={`${styles.opBadge} ${styles.opAppr}`}>
                    {data.projectReviewsSummary.approved} Approved
                  </span>
                  <span className={`${styles.opBadge} ${styles.opRej}`}>
                    {data.projectReviewsSummary.rejected} Rejected
                  </span>
                </div>
              </div>

              {/* Email Quota */}
              <div className={styles.opBlock}>
                <div className={styles.opTop}>
                  <span className={styles.opLabel}>
                    <Mail size={13} /> Resend Email Quota ({fmtNum(data.emailStatus.totalAll)} sent total)
                  </span>
                  <Link href="/admin/email-status" className={styles.viewAll}>Details <ArrowRight size={12} /></Link>
                </div>
                <div className={styles.quotaRow}>
                  <div className={styles.quotaItem}>
                    <div className={styles.quotaMeta}>
                      <span>Daily IST</span>
                      <strong>{data.emailStatus.totalToday} / {data.emailStatus.dailyLimit}</strong>
                    </div>
                    <div className={styles.quotaTrack}>
                      <div
                        className={styles.quotaFill}
                        style={{
                          width: `${Math.min(100, fmtPct(data.emailStatus.totalToday, data.emailStatus.dailyLimit))}%`,
                          background: data.emailStatus.totalToday >= 85 ? '#ef4444' : '#3F5F54',
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.quotaItem}>
                    <div className={styles.quotaMeta}>
                      <span>Monthly</span>
                      <strong>{data.emailStatus.totalMonth} / {data.emailStatus.monthlyLimit}</strong>
                    </div>
                    <div className={styles.quotaTrack}>
                      <div
                        className={styles.quotaFill}
                        style={{
                          width: `${Math.min(100, fmtPct(data.emailStatus.totalMonth, data.emailStatus.monthlyLimit))}%`,
                          background: data.emailStatus.totalMonth >= 2500 ? '#f59e0b' : '#3b82f6',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Offer Codes */}
              <div className={styles.opBlock} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div className={styles.opTop}>
                  <span className={styles.opLabel}>
                    <Ticket size={13} /> Offer Codes ({data.revenue.offerCodesActive} active / {data.revenue.offerCodesTotal})
                  </span>
                  <Link href="/admin/offer-codes" className={styles.viewAll}>Manage <ArrowRight size={12} /></Link>
                </div>
                {data.revenue.topOfferCodes.length === 0 ? (
                  <p className={styles.mutedLine}>No offer codes created yet.</p>
                ) : (
                  <div className={styles.promoList}>
                    {data.revenue.topOfferCodes.map((oc) => (
                      <span key={oc.code} className={`${styles.promoChip} ${oc.active ? '' : styles.promoChipOff}`}>
                        <code>{oc.code}</code> &middot; {oc.discountPercent}% off &middot;{' '}
                        <strong>{oc.usedCount} used</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Row 3: Colleges / Districts & Platform Catalog ─────────── */}
          <section className={styles.twoColGrid}>
            {/* Top Colleges & Delivery Districts */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>
                    <Building2 size={15} className={styles.panelTitleIcon} />
                    Top Colleges &amp; Delivery Reach
                  </h3>
                  <p className={styles.panelSub}>
                    {fmtNum(data.audienceBreakdown.withCollegeCount)} of {fmtNum(data.audienceBreakdown.collegeTotal)} enrollments listed a college ({RANGE_LABELS[range]})
                  </p>
                </div>
              </div>

              <div className={styles.audColumns}>
                <div>
                  <p className={styles.audSubhead}>Top Institutions</p>
                  {data.audienceBreakdown.topColleges.length === 0 ? (
                    <p className={styles.mutedLine}>No college entries in this range.</p>
                  ) : (
                    <ul className={styles.audList}>
                      {data.audienceBreakdown.topColleges.map((c) => (
                        <li key={c.college} className={styles.audItem}>
                          <span className={styles.audName} title={c.college}>{c.college}</span>
                          <span className={styles.audBadge}>{c.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className={styles.audSubhead}>
                    <MapPin size={12} /> Physical Cert Districts
                  </p>
                  {data.audienceBreakdown.topDistricts.length === 0 ? (
                    <p className={styles.mutedLine}>No physical orders in this range.</p>
                  ) : (
                    <ul className={styles.audList}>
                      {data.audienceBreakdown.topDistricts.map((d) => (
                        <li key={d.district} className={styles.audItem}>
                          <span className={styles.audName}>{d.district}</span>
                          <span className={styles.audBadge}>{d.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Catalog Health */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>
                    <Layers size={15} className={styles.panelTitleIcon} />
                    Platform Inventory &amp; Content
                  </h3>
                  <p className={styles.panelSub}>Live document counts across MongoDB collections</p>
                </div>
              </div>

              <div className={styles.catalogGrid}>
                <Link href="/admin/company-internships" className={styles.catalogTile}>
                  <span className={styles.catalogNum}>{fmtNum(data.catalogHealth.companyInternshipsCount)}</span>
                  <span className={styles.catalogLbl}>Company Courses</span>
                </Link>
                <Link href="/admin/domains" className={styles.catalogTile}>
                  <span className={styles.catalogNum}>{fmtNum(data.catalogHealth.domainsCount)}</span>
                  <span className={styles.catalogLbl}>Domains</span>
                </Link>
                <Link href="/admin/batches" className={styles.catalogTile}>
                  <span className={styles.catalogNum}>{fmtNum(data.catalogHealth.batchesCount)}</span>
                  <span className={styles.catalogLbl}>Batches</span>
                </Link>
                <Link href="/admin/programs" className={styles.catalogTile}>
                  <span className={styles.catalogNum}>{fmtNum(data.catalogHealth.programsCount)}</span>
                  <span className={styles.catalogLbl}>Programs</span>
                </Link>
                <Link href="/admin/projects" className={styles.catalogTile}>
                  <span className={styles.catalogNum}>{fmtNum(data.catalogHealth.projectsCount)}</span>
                  <span className={styles.catalogLbl}>Projects</span>
                </Link>
                <Link href="/admin/careers" className={styles.catalogTile}>
                  <span className={styles.catalogNum}>
                    {fmtNum(data.catalogHealth.openCareersCount)}
                    <small className={styles.catalogDenom}>/{data.catalogHealth.totalCareersCount}</small>
                  </span>
                  <span className={styles.catalogLbl}>
                    <Briefcase size={11} /> Open Careers
                  </span>
                </Link>
                <Link href="/admin/event-certificates" className={styles.catalogTile} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.catalogNum}>
                    {fmtNum(data.catalogHealth.eventCertsCount)} events &middot; {fmtNum(data.catalogHealth.eventCertDownloadsCount)} downloads
                  </span>
                  <span className={styles.catalogLbl}>Event Certificates</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ── Row 4: Live Activity Stream + Recent Enrollments ────────── */}
          <section className={styles.twoColGrid}>
            {/* Unified Live Platform Feed */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>
                    <Activity size={15} className={styles.panelTitleIcon} />
                    Live Platform Activity
                  </h3>
                  <p className={styles.panelSub}>Latest enrollments, project reviews, LinkedIn, quizzes &amp; orders</p>
                </div>
              </div>

              {data.liveActivity.length === 0 ? (
                <div className={styles.emptySmall}>No recent activity yet.</div>
              ) : (
                <div className={styles.activityList}>
                  {data.liveActivity.map((act) => (
                    <div key={act.id} className={styles.activityRow}>
                      <span className={`${styles.actDot} ${styles[`act_${act.type}`]}`} />
                      <div className={styles.actBody}>
                        <p className={styles.actTitle}>
                          <strong>{act.title}</strong>
                          <span className={styles.actDetail}> — {act.detail}</span>
                        </p>
                        <p className={styles.actMeta}>
                          {act.domain && <span>{act.domain} &middot; </span>}
                          <span>{fmtRelativeTime(act.at, nowMs)}</span>
                        </p>
                      </div>
                      <span className={`${styles.actStatus} ${styles[`actStatus_${act.status}`] || ''}`}>
                        {act.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Registrations */}
            <div className={styles.panelCard}>
              <div className={styles.recentHeader} style={{ marginBottom: 14 }}>
                <div>
                  <h3 className={styles.panelTitle}>
                    Recent Registrations
                    {stats.unread.registrations > 0 && (
                      <span className={styles.sectionCount} style={{ background: '#10b981', marginLeft: 8 }}>
                        {stats.unread.registrations} new
                      </span>
                    )}
                  </h3>
                  <p className={styles.panelSub}>Latest 12 students with progress status</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {stats.unread.registrations > 0 && (
                    <button
                      className={styles.markReadSmall}
                      onClick={() => markAndReload(['registrations'])}
                    >
                      <BellOff size={12} /> Mark read
                    </button>
                  )}
                  <Link href="/admin/applications" className={styles.viewAll}>
                    View all <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              <div className={styles.recentList}>
                {data.recentRegistrations.length === 0 && (
                  <div className={styles.emptyRecent}>No registrations yet.</div>
                )}
                {data.recentRegistrations.map((r) => (
                  <div key={r.id} className={styles.recentRow}>
                    <div className={styles.recentAvatar}>
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.recentInfo}>
                      <p className={styles.recentName}>{r.name}</p>
                      <p className={styles.recentEmail}>{r.email}</p>
                      {r.college && <p className={styles.recentCollege}>{r.college}</p>}
                    </div>
                    <span className={styles.recentDomain}>{r.domain}</span>
                    <div className={styles.recentMeta}>
                      <span className={styles.recentDate}>{fmtRelativeTime(r.createdAt, nowMs)}</span>
                      <span className={`${styles.recentLi} ${
                        r.linkedinVerified === true      ? styles.liVerified :
                        r.linkedinVerified === 'pending' ? styles.liPending  : styles.liNone
                      }`}>
                        {r.linkedinVerified === true ? (
                          <><CheckCircle size={11} /> LI · {r.stepsDone}/4{r.eCertPaid ? ' · Paid' : ''}</>
                        ) : r.linkedinVerified === 'pending' ? (
                          <><Clock size={11} /> LI Pending</>
                        ) : (
                          <><TrendingUp size={11} /> New</>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── System Settings (Preserved) ─────────────────────────────── */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: '#f59e0b' }} />
              System Settings
              <span className={styles.sectionSub}>Site-wide controls</span>
            </h2>
            {settingsLoad ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--secondary-text)', fontSize: '0.875rem' }}>
                <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading…
              </div>
            ) : (
              <div className={styles.settingsCard}>
                <div className={styles.settingsRow}>
                  <div className={styles.settingsRowLeft}>
                    <div
                      className={styles.settingsIcon}
                      style={{
                        background: settings.maintenanceMode ? '#fef3c7' : '#f0fdf4',
                        color: settings.maintenanceMode ? '#92400e' : '#166534',
                      }}
                    >
                      {settings.maintenanceMode ? <AlertTriangle size={18} /> : <Power size={18} />}
                    </div>
                    <div>
                      <p className={styles.settingsLabel}>Site Status</p>
                      <p className={styles.settingsHint}>
                        {settings.maintenanceMode
                          ? 'Site is OFFLINE — visitors see the maintenance page'
                          : 'Site is ONLINE — all pages accessible normally'}
                      </p>
                    </div>
                  </div>
                  <button
                    id="maintenance-toggle-btn"
                    className={`${styles.toggleBtn} ${settings.maintenanceMode ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => saveSettings({ maintenanceMode: !settings.maintenanceMode })}
                    disabled={settingsSave}
                    title={settings.maintenanceMode ? 'Turn site ON (disable maintenance)' : 'Turn site OFF (enable maintenance)'}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>

                <div className={styles.settingsMessageWrap}>
                  <label className={styles.settingsMessageLabel}>
                    <Settings size={13} /> Maintenance Message
                  </label>
                  <textarea
                    id="maintenance-message"
                    className={styles.settingsTextarea}
                    rows={4}
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings((s) => ({ ...s, maintenanceMessage: e.target.value }))}
                    placeholder="Type the message visitors will see on the maintenance page…"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    <button
                      id="save-maintenance-message-btn"
                      className={styles.saveSettingsBtn}
                      onClick={() => saveSettings({})}
                      disabled={settingsSave}
                    >
                      {settingsSave ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Settings size={13} />}
                      {settingsSave ? 'Saving…' : 'Save Message'}
                    </button>
                    {settingsMsg && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: settingsMsg.ok ? '#007a63' : '#c0334d' }}>
                        {settingsMsg.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
