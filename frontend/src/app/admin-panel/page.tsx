'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './AdminPanel.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReferralEntry {
  name: string;
  email: string;
  code: string;
  domain: string;
  createdAt: string;
  referredCount: number;
  referredUsers: { name: string; email: string; domain: string; joinedAt: string }[];
}

interface PhysicalCert {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  district: string;
  pincode: string;
  registeredAt: string;
}

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

// ─── Admin Panel ──────────────────────────────────────────────────────────────
export default function AdminPanelPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authed,   setAuthed]   = useState(false);
  const [authErr,  setAuthErr]  = useState('');
  const [tab,      setTab]      = useState<'referrals' | 'certs' | 'emails'>('referrals');

  // Referrals
  const [referrals,    setReferrals]    = useState<ReferralEntry[]>([]);
  const [refLoading,   setRefLoading]   = useState(false);
  const [expanded,     setExpanded]     = useState<string | null>(null);

  // Physical certs
  const [certs,        setCerts]        = useState<PhysicalCert[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);

  // Email stats
  const [emailStats,   setEmailStats]   = useState<EmailStats | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErr,     setEmailErr]     = useState('');

  const fetchReferrals = useCallback(async (key: string) => {
    setRefLoading(true);
    try {
      const res  = await fetch('/api/admin/referrals', { headers: { 'x-admin-key': key } });
      const data = await res.json();
      if (data.success) setReferrals(data.data);
    } finally {
      setRefLoading(false);
    }
  }, []);

  const fetchCerts = useCallback(async () => {
    setCertsLoading(true);
    try {
      const res  = await fetch('/api/admin/physical-certificates');
      const data = await res.json();
      if (data.success) setCerts(data.users);
    } finally {
      setCertsLoading(false);
    }
  }, []);

  const fetchEmailStats = useCallback(async () => {
    setEmailLoading(true);
    setEmailErr('');
    try {
      const res  = await fetch('/api/admin/email-stats');
      const data = await res.json();
      if (data.success) setEmailStats(data);
      else setEmailErr(data.message ?? 'Failed to load.');
    } catch {
      setEmailErr('Network error. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) { setAuthErr('Enter admin key.'); return; }
    setAuthErr('');
    setAuthed(true);
    fetchReferrals(adminKey);
    fetchCerts();
  };

  useEffect(() => {
    if (authed && tab === 'referrals') fetchReferrals(adminKey);
    if (authed && tab === 'certs')     fetchCerts();
    if (authed && tab === 'emails')    fetchEmailStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className={styles.loginShell}>
        <div className={styles.loginCard}>
          <Image src="/logo.png" alt="skillinf" width={120} height={32} style={{ objectFit: 'contain', marginBottom: 24 }} />
          <h1 className={styles.loginTitle}>Admin Panel</h1>
          <p className={styles.loginSub}>Enter your admin key to continue</p>
          <form onSubmit={handleAuth} className={styles.loginForm}>
            <input
              type="password"
              className={styles.loginInput}
              placeholder="Admin key"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              autoFocus
            />
            {authErr && <p className={styles.loginErr}>{authErr}</p>}
            <button type="submit" className={styles.loginBtn}>Access Panel</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  return (
    <div className={styles.shell}>

      {/* Topbar */}
      <div className={styles.topbar}>
        <Image src="/logo.png" alt="skillinf" width={110} height={28} style={{ objectFit: 'contain' }} />
        <div className={styles.topRight}>
          <span className={styles.topLabel}>Admin Panel</span>
          <button className={styles.logoutBtn} onClick={() => { setAuthed(false); setAdminKey(''); }}>Sign out</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        <button className={`${styles.tab} ${tab === 'referrals' ? styles.tabActive : ''}`} onClick={() => setTab('referrals')}>
          Referral Management
        </button>
        <button className={`${styles.tab} ${tab === 'certs' ? styles.tabActive : ''}`} onClick={() => setTab('certs')}>
          Physical Certificates
        </button>
        <button className={`${styles.tab} ${tab === 'emails' ? styles.tabActive : ''}`} onClick={() => setTab('emails')}>
          📧 Email Quota
        </button>
      </div>

      <div className={styles.body}>

        {/* ── Referrals Tab ── */}
        {tab === 'referrals' && (
          <div>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Referral Management</h2>
                <p className={styles.sectionSub}>Members sorted by most referrals. Click a row to see who they referred.</p>
              </div>
              <button className={styles.refreshBtn} onClick={() => fetchReferrals(adminKey)} disabled={refLoading}>
                {refLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            {refLoading ? (
              <div className={styles.loading}>Loading referral data…</div>
            ) : referrals.length === 0 ? (
              <div className={styles.empty}>No referral data found.</div>
            ) : (
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>Member Name</span>
                  <span>Email</span>
                  <span>Referral Code</span>
                  <span>Domain</span>
                  <span>Referred</span>
                </div>
                {referrals.map(r => (
                  <div key={r.code}>
                    <div
                      className={`${styles.tableRow} ${expanded === r.code ? styles.tableRowOpen : ''}`}
                      onClick={() => setExpanded(expanded === r.code ? null : r.code)}
                    >
                      <span className={styles.name}>{r.name}</span>
                      <span className={styles.email}>{r.email}</span>
                      <span className={styles.code}>{r.code}</span>
                      <span className={styles.domain}>{r.domain}</span>
                      <span className={`${styles.count} ${r.referredCount > 0 ? styles.countActive : ''}`}>
                        {r.referredCount} {r.referredCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    {expanded === r.code && r.referredUsers.length > 0 && (
                      <div className={styles.subTable}>
                        <div className={styles.subHead}>
                          <span>Name</span><span>Email</span><span>Domain</span><span>Joined</span>
                        </div>
                        {r.referredUsers.map((ru, i) => (
                          <div key={i} className={styles.subRow}>
                            <span>{ru.name}</span>
                            <span className={styles.email}>{ru.email}</span>
                            <span>{ru.domain}</span>
                            <span className={styles.date}>{ru.joinedAt ? new Date(ru.joinedAt).toLocaleDateString('en-IN') : '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {expanded === r.code && r.referredUsers.length === 0 && (
                      <div className={styles.subEmpty}>This member has not referred anyone yet.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Physical Certs Tab ── */}
        {tab === 'certs' && (
          <div>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Physical Certificate Orders</h2>
                <p className={styles.sectionSub}>{certs.length} order{certs.length !== 1 ? 's' : ''} pending / fulfilled.</p>
              </div>
              <button className={styles.refreshBtn} onClick={fetchCerts} disabled={certsLoading}>
                {certsLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            {certsLoading ? (
              <div className={styles.loading}>Loading orders…</div>
            ) : certs.length === 0 ? (
              <div className={styles.empty}>No physical certificate orders yet.</div>
            ) : (
              <div className={styles.table}>
                <div className={`${styles.tableHead} ${styles.tableHeadCerts}`}>
                  <span>Name</span><span>Email</span><span>Mobile</span>
                  <span>Address</span><span>District</span><span>Pincode</span><span>Date</span>
                </div>
                {certs.map(c => (
                  <div key={c.id} className={`${styles.tableRow} ${styles.tableRowCerts}`}>
                    <span className={styles.name}>{c.name}</span>
                    <span className={styles.email}>{c.email}</span>
                    <span>{c.mobile}</span>
                    <span className={styles.addr}>{c.address}</span>
                    <span>{c.district}</span>
                    <span>{c.pincode}</span>
                    <span className={styles.date}>{c.registeredAt ? new Date(c.registeredAt).toLocaleDateString('en-IN') : '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Email Quota Tab ── */}
        {tab === 'emails' && (
          <div>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Email Quota &amp; Stats</h2>
                <p className={styles.sectionSub}>
                  Tracks all emails sent via Resend &nbsp;·&nbsp; IST date: {emailStats?.istDate ?? '—'}
                  {emailStats?.resendStatus && (
                    <span style={{
                      marginLeft: 10, padding: '2px 10px', borderRadius: 100,
                      background: emailStats.resendStatus === 'active' ? '#dcfce7' : '#fee2e2',
                      color: emailStats.resendStatus === 'active' ? '#16a34a' : '#dc2626',
                      fontSize: '0.72rem', fontWeight: 700,
                    }}>
                      Resend API {emailStats.resendStatus === 'active' ? '✓ Active' : '✗ Error'}
                    </span>
                  )}
                </p>
              </div>
              <button className={styles.refreshBtn} onClick={fetchEmailStats} disabled={emailLoading}>
                {emailLoading ? 'Loading…' : '↻ Refresh'}
              </button>
            </div>

            {emailLoading && <div className={styles.loading}>Loading email stats…</div>}

            {emailErr && !emailLoading && (
              <div className={styles.empty} style={{ color: '#ef4444' }}>⚠ {emailErr}</div>
            )}

            {!emailLoading && !emailStats && !emailErr && (
              <div className={styles.loading}>Click ↻ Refresh to load email quota stats.</div>
            )}

            {emailStats && !emailLoading && (() => {
              const { quota, totalAll, totalToday, totalMonth, byType } = emailStats;
              const dailyPct   = Math.min(100, Math.round((quota.daily.used   / quota.daily.limit)   * 100));
              const monthlyPct = Math.min(100, Math.round((quota.monthly.used / quota.monthly.limit) * 100));
              const dailyColor   = dailyPct   >= 90 ? '#ef4444' : dailyPct   >= 70 ? '#f59e0b' : '#10b981';
              const monthlyColor = monthlyPct >= 90 ? '#ef4444' : monthlyPct >= 70 ? '#f59e0b' : '#10b981';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                  {/* Info note when no emails sent yet */}
                  {totalAll === 0 && (
                    <div style={{
                      background: '#eff6ff', border: '1.5px solid #bfdbfe',
                      borderRadius: 12, padding: '14px 18px',
                      fontSize: '0.85rem', color: '#1d4ed8', lineHeight: 1.6,
                    }}>
                      ℹ️ <strong>Email tracking started.</strong> No emails have been logged yet.
                      Counts update automatically after the first email is sent
                      (project approval, due-date reminder, etc).
                    </div>
                  )}

                  {/* Quota meters */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }}>

                    {/* Daily */}
                    <div className={styles.emailCard}>
                      <p className={styles.emailCardLabel}>📅 Daily Quota (IST)</p>
                      <p className={styles.emailCardBig} style={{ color: dailyColor }}>
                        {quota.daily.remaining}
                        <span className={styles.emailCardUnit}> remaining</span>
                      </p>
                      <div className={styles.quotaBar}>
                        <div className={styles.quotaBarFill}
                          style={{ width: `${Math.max(dailyPct, 2)}%`, background: dailyColor }} />
                      </div>
                      <p className={styles.emailCardMeta}>
                        {quota.daily.used} sent &nbsp;/&nbsp; {quota.daily.limit} daily limit
                      </p>
                    </div>

                    {/* Monthly */}
                    <div className={styles.emailCard}>
                      <p className={styles.emailCardLabel}>📆 Monthly · {emailStats.istMonth}</p>
                      <p className={styles.emailCardBig} style={{ color: monthlyColor }}>
                        {quota.monthly.remaining}
                        <span className={styles.emailCardUnit}> remaining</span>
                      </p>
                      <div className={styles.quotaBar}>
                        <div className={styles.quotaBarFill}
                          style={{ width: `${Math.max(monthlyPct, 2)}%`, background: monthlyColor }} />
                      </div>
                      <p className={styles.emailCardMeta}>
                        {quota.monthly.used} sent &nbsp;/&nbsp; {quota.monthly.limit} monthly limit
                      </p>
                    </div>

                    {/* All time */}
                    <div className={styles.emailCard}>
                      <p className={styles.emailCardLabel}>📊 Total Emails Sent</p>
                      <p className={styles.emailCardBig} style={{ color: '#6366f1' }}>
                        {totalAll}
                        <span className={styles.emailCardUnit}> all time</span>
                      </p>
                      <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
                        <div>
                          <p className={styles.emailCardMeta}>Today (IST)</p>
                          <p className={styles.emailCardSubBig}>{totalToday}</p>
                        </div>
                        <div>
                          <p className={styles.emailCardMeta}>This Month</p>
                          <p className={styles.emailCardSubBig}>{totalMonth}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Type breakdown */}
                  <div>
                    <h3 className={styles.emailBreakdownTitle}>Breakdown by Email Type</h3>
                    {byType.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                        No emails tracked yet — will appear here once emails start sending.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {byType.map(t => (
                          <div key={t.type} className={styles.emailBreakdownRow}>
                            <span className={styles.emailTypeLabel}>{t.type.replace(/_/g, ' ')}</span>
                            <div className={styles.emailTypeBar}>
                              <div
                                className={styles.emailTypeBarFill}
                                style={{ width: `${Math.round((t.count / totalAll) * 100)}%` }}
                              />
                            </div>
                            <span className={styles.emailTypeCount}>{t.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
