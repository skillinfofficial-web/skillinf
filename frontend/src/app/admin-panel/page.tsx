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

// ─── Admin Panel ──────────────────────────────────────────────────────────────
export default function AdminPanelPage() {
  const [adminKey, setAdminKey]       = useState('');
  const [authed,   setAuthed]         = useState(false);
  const [authErr,  setAuthErr]        = useState('');
  const [tab,      setTab]            = useState<'referrals' | 'certs'>('referrals');

  // Referrals
  const [referrals,    setReferrals]    = useState<ReferralEntry[]>([]);
  const [refLoading,   setRefLoading]   = useState(false);
  const [expanded,     setExpanded]     = useState<string | null>(null);

  // Physical certs
  const [certs,        setCerts]        = useState<PhysicalCert[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);

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

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) { setAuthErr('Enter admin key.'); return; }
    // Quick client-side pre-check — server validates properly
    setAuthErr('');
    setAuthed(true);
    fetchReferrals(adminKey);
    fetchCerts();
  };

  useEffect(() => {
    if (authed && tab === 'referrals') fetchReferrals(adminKey);
    if (authed && tab === 'certs')     fetchCerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Login screen ─────────────────────────────────────────────────────────
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

  // ── Authenticated ─────────────────────────────────────────────────────────
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
        <button
          className={`${styles.tab} ${tab === 'referrals' ? styles.tabActive : ''}`}
          onClick={() => setTab('referrals')}
        >
          Referral Management
        </button>
        <button
          className={`${styles.tab} ${tab === 'certs' ? styles.tabActive : ''}`}
          onClick={() => setTab('certs')}
        >
          Physical Certificates
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
                {/* Table header */}
                <div className={styles.tableHead}>
                  <span>Member Name</span>
                  <span>Email</span>
                  <span>Referral Code</span>
                  <span>Domain</span>
                  <span>Referred</span>
                </div>

                {referrals.map(r => (
                  <div key={r.code}>
                    {/* Row */}
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

                    {/* Expanded — list of referred users */}
                    {expanded === r.code && r.referredUsers.length > 0 && (
                      <div className={styles.subTable}>
                        <div className={styles.subHead}>
                          <span>Name</span>
                          <span>Email</span>
                          <span>Domain</span>
                          <span>Joined</span>
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
                  <span>Name</span>
                  <span>Email</span>
                  <span>Mobile</span>
                  <span>Address</span>
                  <span>District</span>
                  <span>Pincode</span>
                  <span>Date</span>
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

      </div>
    </div>
  );
}
