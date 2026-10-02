'use client';

import { useState, useEffect } from 'react';
import styles from './EmailStatus.module.css';

interface EmailStats {
  totalAll: number;
  totalToday: number;
  totalMonth: number;
  byType: { type: string; count: number }[];
  resendStatus?: string;
  quota: {
    daily:   { used: number; limit: number; remaining: number };
    monthly: { used: number; limit: number; remaining: number };
  };
  istDate: string;
  istMonth: string;
}

export default function EmailStatusPage() {
  const [stats,   setStats]   = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      // Call the frontend's email-stats API via absolute URL
      const res  = await fetch('/api/email-status');
      const data = await res.json();
      if (data.success) setStats(data);
      else setError(data.message ?? 'Failed to load.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Email Status</h1>
          <p className={styles.sub}>
            Resend email quota &amp; delivery tracking &nbsp;·&nbsp; IST date: {stats?.istDate ?? '—'}
            {stats?.resendStatus && (
              <span className={stats.resendStatus === 'active' ? styles.badgeActive : styles.badgeError}>
                Resend API {stats.resendStatus === 'active' ? '✓ Active' : '✗ Error'}
              </span>
            )}
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchStats} disabled={loading}>
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {loading && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p>Loading email stats…</p>
        </div>
      )}

      {error && !loading && (
        <div className={styles.errorBox}>⚠ {error}</div>
      )}

      {stats && !loading && (() => {
        const { quota, totalAll, totalToday, totalMonth, byType } = stats;
        const dailyPct   = Math.min(100, Math.round((quota.daily.used   / quota.daily.limit)   * 100));
        const monthlyPct = Math.min(100, Math.round((quota.monthly.used / quota.monthly.limit) * 100));
        const dailyColor   = dailyPct   >= 90 ? '#ef4444' : dailyPct   >= 70 ? '#f59e0b' : '#10b981';
        const monthlyColor = monthlyPct >= 90 ? '#ef4444' : monthlyPct >= 70 ? '#f59e0b' : '#10b981';

        return (
          <>
            {/* Zero state info */}
            {totalAll === 0 && (
              <div className={styles.infoBox}>
                ℹ️ <strong>Email tracking started.</strong> No emails have been logged yet.
                Counts update automatically after the first email is sent
                (project approval, due-date reminder, etc).
              </div>
            )}

            {/* Quota cards */}
            <div className={styles.cards}>

              {/* Daily */}
              <div className={styles.card}>
                <p className={styles.cardLabel}>📅 Daily Quota (IST)</p>
                <p className={styles.cardBig} style={{ color: dailyColor }}>
                  {quota.daily.remaining}
                  <span className={styles.cardUnit}> remaining</span>
                </p>
                <div className={styles.bar}>
                  <div className={styles.barFill}
                    style={{ width: `${Math.max(dailyPct, 2)}%`, background: dailyColor }} />
                </div>
                <p className={styles.cardMeta}>
                  {quota.daily.used} sent &nbsp;/&nbsp; {quota.daily.limit} daily limit
                </p>
              </div>

              {/* Monthly */}
              <div className={styles.card}>
                <p className={styles.cardLabel}>📆 Monthly Quota · {stats.istMonth}</p>
                <p className={styles.cardBig} style={{ color: monthlyColor }}>
                  {quota.monthly.remaining}
                  <span className={styles.cardUnit}> remaining</span>
                </p>
                <div className={styles.bar}>
                  <div className={styles.barFill}
                    style={{ width: `${Math.max(monthlyPct, 2)}%`, background: monthlyColor }} />
                </div>
                <p className={styles.cardMeta}>
                  {quota.monthly.used} sent &nbsp;/&nbsp; {quota.monthly.limit} monthly limit
                </p>
              </div>

              {/* All time */}
              <div className={styles.card}>
                <p className={styles.cardLabel}>📊 Total Emails Sent</p>
                <p className={styles.cardBig} style={{ color: '#6366f1' }}>
                  {totalAll}
                  <span className={styles.cardUnit}> all time</span>
                </p>
                <div className={styles.subStats}>
                  <div>
                    <p className={styles.cardMeta}>Today (IST)</p>
                    <p className={styles.cardSubBig}>{totalToday}</p>
                  </div>
                  <div>
                    <p className={styles.cardMeta}>This Month</p>
                    <p className={styles.cardSubBig}>{totalMonth}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Type breakdown */}
            <div className={styles.breakdownSection}>
              <h2 className={styles.breakdownTitle}>Breakdown by Email Type</h2>
              {byType.length === 0 ? (
                <p className={styles.emptyText}>
                  No emails tracked yet — will appear here once emails start sending.
                </p>
              ) : (
                <div className={styles.breakdownList}>
                  {byType.map(t => (
                    <div key={t.type} className={styles.breakdownRow}>
                      <span className={styles.typeLabel}>{t.type.replace(/_/g, ' ')}</span>
                      <div className={styles.typeBar}>
                        <div
                          className={styles.typeBarFill}
                          style={{ width: `${Math.round((t.count / totalAll) * 100)}%` }}
                        />
                      </div>
                      <span className={styles.typeCount}>{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
