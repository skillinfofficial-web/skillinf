'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, Link2, Award, Package,
  TrendingUp, RefreshCw, ArrowRight, CheckCircle,
  Clock, Loader2, BellOff, Bell,
} from 'lucide-react';
import styles from './dashboard.module.css';

/* ── Types ────────────────────────────────────────────────────────────────── */
interface Unread {
  registrations:   number;
  linkedinPending: number;
  eCertPending:    number;
  physicalCert:    number;
}
interface Totals {
  pendingLinkedin:  number;
  pendingECert:     number;
  pendingPhysical:  number;
  linkedinVerified: number;
  certUnlocked:     number;
}
interface StepCompletion { step1: number; step2: number; step3: number; step4: number; }
interface LastRead {
  registrations: string; linkedinPending: string;
  eCertPending: string;  physicalCert: string;
}
interface Stats {
  totalUsers: number;
  unread: Unread;
  totals: Totals;
  stepCompletion: StepCompletion;
  lastRead: LastRead;
}
interface RecentReg {
  id: string; name: string; email: string;
  domain: string; createdAt: string;
  linkedinVerified: boolean | 'pending';
}

/* ── Mark-as-read helper ──────────────────────────────────────────────────── */
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
  total: number; unread: number;
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
          <span className={styles.alertTotal}>{total}</span>
          {unread > 0 && (
            <span className={styles.alertUnread} style={{ background: color }}>
              {unread} new
            </span>
          )}
        </div>
      </Link>
      {unread > 0 && onRead && (
        <button className={styles.markReadBtn} onClick={onRead} title="Mark as read">
          <BellOff size={13} /> Mark read
        </button>
      )}
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({
  icon, label, value, unread, href, color,
}: {
  icon: React.ReactNode; label: string; value: number;
  unread?: number; href?: string; color: string;
}) {
  return (
    <div className={styles.statCard} style={{ '--accent': color } as React.CSSProperties}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statBody}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
      </div>
      {unread !== undefined && unread > 0 && (
        <span className={styles.badge} style={{ background: color }}>+{unread} new</span>
      )}
      {href && (
        <Link href={href} className={styles.statLink} aria-label={`Go to ${label}`}>
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [recent,      setRecent]      = useState<RecentReg[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/dashboard-stats');
      const d = await r.json();
      if (d.success) {
        setStats(d.stats);
        setRecent(d.recentRegistrations);
        setLastRefresh(new Date());
      }
    } catch {/* silently fail */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Mark-read helpers ─────────────────────────────────────────────────── */
  const markAndReload = async (cats: string[]) => {
    await markRead(cats);
    await load();
  };

  const markAllRead = () =>
    markAndReload(['registrations', 'linkedinPending', 'eCertPending', 'physicalCert']);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const totalUnread = stats
    ? stats.unread.registrations + stats.unread.linkedinPending +
      stats.unread.eCertPending  + stats.unread.physicalCert
    : 0;

  const totalActionNeeded = stats
    ? stats.totals.pendingLinkedin + stats.totals.pendingECert + stats.totals.pendingPhysical
    : 0;

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Dashboard</h1>
            {totalUnread > 0 && (
              <span className={styles.unreadDot}>
                <Bell size={13} /> {totalUnread} unread
              </span>
            )}
          </div>
          <p className={styles.desc}>
            {lastRefresh ? `Refreshed at ${fmtTime(lastRefresh)}` : 'Loading…'}
          </p>
        </div>
        <div className={styles.headerBtns}>
          {totalUnread > 0 && (
            <button className={styles.markAllBtn} onClick={markAllRead} disabled={loading} id="mark-all-read-btn">
              <BellOff size={14} /> Mark all read
            </button>
          )}
          <button className={styles.refreshBtn} onClick={load} disabled={loading} id="refresh-dashboard-btn">
            {loading ? <Loader2 size={15} className={styles.spin} /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>
      </header>

      {loading && !stats && (
        <div className={styles.loadBox}>
          <Loader2 size={28} className={styles.spin} />
          <span>Loading dashboard…</span>
        </div>
      )}

      {stats && (
        <>
          {/* ── New / Unread Alert strip ─────────────────────────────── */}
          {totalUnread > 0 && (
            <div className={styles.unreadStrip}>
              <Bell size={16} className={styles.stripBell} />
              <span>
                You have <strong>{totalUnread}</strong> unread item{totalUnread !== 1 ? 's' : ''} since your last visit.
                Click <strong>Mark all read</strong> once you&apos;ve reviewed them.
              </span>
            </div>
          )}
          {totalUnread === 0 && !loading && (
            <div className={styles.allReadStrip}>
              <CheckCircle size={15} />
              <span>All caught up — no new items since your last visit.</span>
            </div>
          )}

          {/* ── Action Needed ────────────────────────────────────────── */}
          {totalActionNeeded > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionDot} style={{ background: '#ef4444' }} />
                Action Needed
                <span className={styles.sectionCount}>{totalActionNeeded}</span>
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
                  icon={<Award size={20} />}
                  title="E-Certificates to Issue"
                  total={stats.totals.pendingECert}
                  unread={stats.unread.eCertPending}
                  desc="Paid but certificate not yet issued"
                  href="/admin/e-certificate"
                  color="#7c3aed"
                  onRead={() => markAndReload(['eCertPending'])}
                />
                <AlertCard
                  icon={<Package size={20} />}
                  title="Physical Certificates"
                  total={stats.totals.pendingPhysical}
                  unread={stats.unread.physicalCert}
                  desc="Pending physical certificate dispatch"
                  href="/admin/physical-certificates"
                  color="#f59e0b"
                  onRead={() => markAndReload(['physicalCert'])}
                />
              </div>
            </section>
          )}

          {/* ── Stats Grid ───────────────────────────────────────────── */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: '#10b981' }} />
              Overview
            </h2>
            <div className={styles.statsGrid}>
              <StatCard
                icon={<Users size={22} />}
                label="Total Students"
                value={stats.totalUsers}
                href="/admin/applications"
                color="#3b82f6"
              />
              <StatCard
                icon={<UserPlus size={22} />}
                label="New Registrations"
                value={stats.unread.registrations}
                unread={stats.unread.registrations}
                href="/admin/applications"
                color="#10b981"
              />
              <StatCard
                icon={<Link2 size={22} />}
                label="LinkedIn Verified"
                value={stats.totals.linkedinVerified}
                href="/admin/linkedin-verify"
                color="#0a66c2"
              />
              <StatCard
                icon={<Award size={22} />}
                label="Certificates Issued"
                value={stats.totals.certUnlocked}
                href="/admin/e-certificate"
                color="#7c3aed"
              />
            </div>
          </section>

          {/* ── Step Completion ───────────────────────────────────────── */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: '#7c3aed' }} />
              Step Completion
              <span className={styles.sectionSub}>out of {stats.totalUsers} students</span>
            </h2>
            <div className={styles.stepsGrid}>
              {(['step1', 'step2', 'step3', 'step4'] as const).map((k, i) => {
                const val = stats.stepCompletion[k];
                const pct = stats.totalUsers > 0 ? Math.round((val / stats.totalUsers) * 100) : 0;
                return (
                  <div key={k} className={styles.stepCard}>
                    <div className={styles.stepTop}>
                      <span className={styles.stepLabel}>Step {i + 1}</span>
                      <span className={styles.stepNum}>{val} / {stats.totalUsers}</span>
                    </div>
                    <div className={styles.stepTrack}>
                      <div className={styles.stepFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.stepPct}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Recent Registrations ──────────────────────────────────── */}
          <section>
            <div className={styles.recentHeader}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                <span className={styles.sectionDot} style={{ background: '#3b82f6' }} />
                Recent Registrations
                {stats.unread.registrations > 0 && (
                  <span className={styles.sectionCount} style={{ background: '#10b981' }}>
                    {stats.unread.registrations} new
                  </span>
                )}
              </h2>
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
              {recent.length === 0 && (
                <div className={styles.emptyRecent}>No registrations yet.</div>
              )}
              {recent.map((r) => (
                <div key={r.id} className={styles.recentRow}>
                  <div className={styles.recentAvatar}>
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.recentInfo}>
                    <p className={styles.recentName}>{r.name}</p>
                    <p className={styles.recentEmail}>{r.email}</p>
                  </div>
                  <span className={styles.recentDomain}>{r.domain}</span>
                  <div className={styles.recentMeta}>
                    <span className={styles.recentDate}>{fmtDate(r.createdAt)}</span>
                    <span className={`${styles.recentLi} ${
                      r.linkedinVerified === true      ? styles.liVerified :
                      r.linkedinVerified === 'pending' ? styles.liPending  : styles.liNone
                    }`}>
                      {r.linkedinVerified === true ? (
                        <><CheckCircle size={11} /> Verified</>
                      ) : r.linkedinVerified === 'pending' ? (
                        <><Clock size={11} /> Pending</>
                      ) : (
                        <><TrendingUp size={11} /> Not submitted</>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
