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

interface OfferCode {
  _id: string;
  code: string;
  discountPercent: number;
  limitType: 'time' | 'count';
  active: boolean;
  usedCount: number;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  maxCount?: number;
}

// ─── Event Certificate types ──────────────────────────────────────────────────
interface EvTemplate { label: string; imageUrl: string; order: number; }
interface EvPrize    { prizeLabel: string; email: string; templateIndex: number; }
interface EvContent  {
  templateIndex: number;
  topText: string;  topColor: string;  topFontSize: number;
  nameYPercent: number; nameColor: string; nameFontSize: number;
  bodyText: string; bodyColor: string; bodyFontSize: number;
}
interface EvCertDoc {
  _id: string; programId: string; programName: string;
  templates: EvTemplate[]; participants: string[];
  prizes: EvPrize[]; contents: EvContent[];
  createdAt: string;
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
export default function AdminPanelPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authed,   setAuthed]   = useState(false);
  const [authErr,  setAuthErr]  = useState('');
  const [tab,      setTab]      = useState<'referrals' | 'certs' | 'emails' | 'offers' | 'eventcerts'>('referrals');

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

  // Offer codes
  const [offerCodes,       setOfferCodes]       = useState<OfferCode[]>([]);
  const [offerLoading,     setOfferLoading]     = useState(false);
  const [offerErr,         setOfferErr]         = useState('');
  const [offerSuccess,     setOfferSuccess]     = useState('');
  const [offerDiscount,    setOfferDiscount]    = useState('');
  const [offerLimitType,   setOfferLimitType]   = useState<'time' | 'count'>('time');
  const [offerEndDate,     setOfferEndDate]     = useState('');
  const [offerCount,       setOfferCount]       = useState('');
  const [generatedCode,    setGeneratedCode]    = useState('');
  const [offerCreating,    setOfferCreating]    = useState(false);

  // ── Event Certificates ────────────────────────────────────────────────────
  const [programs,       setPrograms]       = useState<{ _id: string; name: string }[]>([]);
  const [evCerts,        setEvCerts]        = useState<EvCertDoc[]>([]);
  const [evLoading,      setEvLoading]      = useState(false);
  const [evErr,          setEvErr]          = useState('');
  const [evSuccess,      setEvSuccess]      = useState('');
  const [evShowForm,     setEvShowForm]     = useState(false);
  const [evEditing,      setEvEditing]      = useState<string | null>(null);
  const [evSaving,       setEvSaving]       = useState(false);
  const [evUploading,    setEvUploading]    = useState(false);
  // form
  const [evProgramId,    setEvProgramId]    = useState('');
  const [evTemplates,    setEvTemplates]    = useState<EvTemplate[]>([]);
  const [evParticipants, setEvParticipants] = useState<string[]>([]);
  const [evPrizes,       setEvPrizes]       = useState<EvPrize[]>([]);
  const [evContents,     setEvContents]     = useState<EvContent[]>([]);

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

  const fetchOfferCodes = useCallback(async (key: string) => {
    setOfferLoading(true);
    setOfferErr('');
    try {
      const res  = await fetch('/api/admin/offer-codes', { headers: { 'x-admin-key': key } });
      const data = await res.json();
      if (data.success) setOfferCodes(data.data);
      else setOfferErr(data.message ?? 'Failed to load.');
    } catch {
      setOfferErr('Network error.');
    } finally {
      setOfferLoading(false);
    }
  }, []);

  const createOfferCode = async () => {
    setOfferErr('');
    setOfferSuccess('');
    setGeneratedCode('');
    const pct = Number(offerDiscount);
    if (!pct || pct < 1 || pct > 100) { setOfferErr('Discount must be 1–100%.'); return; }
    if (offerLimitType === 'time' && !offerEndDate) { setOfferErr('Please select an end date & time.'); return; }
    if (offerLimitType === 'count' && (!offerCount || Number(offerCount) < 1)) { setOfferErr('Enter a valid usage count (min 1).'); return; }

    setOfferCreating(true);
    try {
      const body = {
        discountPercent: pct,
        limitType: offerLimitType,
        limitValue: offerLimitType === 'time' ? offerEndDate : Number(offerCount),
      };
      const res  = await fetch('/api/admin/offer-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCode(data.code);
        setOfferSuccess('Offer code created successfully!');
        setOfferDiscount('');
        setOfferEndDate('');
        setOfferCount('');
        fetchOfferCodes(adminKey);
      } else {
        setOfferErr(data.message ?? 'Failed to create code.');
      }
    } catch {
      setOfferErr('Network error.');
    } finally {
      setOfferCreating(false);
    }
  };

  const deactivateCode = async (id: string) => {
    try {
      await fetch(`/api/admin/offer-codes?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      fetchOfferCodes(adminKey);
    } catch { /* ignore */ }
  };

  // ── Event Certificate helpers ─────────────────────────────────────────────
  const fetchPrograms = useCallback(async () => {
    try {
      const res  = await fetch('/api/programs');
      const data = await res.json();
      if (data.success) setPrograms(data.programs.map((p: { _id: string; name: string }) => ({ _id: p._id, name: p.name })));
    } catch { /* ignore */ }
  }, []);

  const fetchEvCerts = useCallback(async () => {
    setEvLoading(true);
    try {
      const res  = await fetch('/api/event-certificates');
      const data = await res.json();
      if (data.success) setEvCerts(data.data);
    } finally {
      setEvLoading(false);
    }
  }, []);

  const syncEvContents = (templates: EvTemplate[]) => {
    setEvContents(prev => templates.map((_, i) => {
      const ex = prev.find(c => c.templateIndex === i);
      return ex ?? {
        templateIndex: i,
        topText: '',    topColor: '#1e293b',  topFontSize: 28,
        nameYPercent: 50, nameColor: '#0f172a', nameFontSize: 52,
        bodyText: '',   bodyColor: '#334155',  bodyFontSize: 22,
      };
    }));
  };

  const uploadTemplateImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res  = await fetch('/api/event-certificates/upload-template', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.url as string;
  };

  const resetEvForm = () => {
    setEvProgramId(''); setEvTemplates([]); setEvParticipants([]);
    setEvPrizes([]); setEvContents([]); setEvEditing(null); setEvErr(''); setEvSuccess('');
  };

  const handleEvCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text   = e.target?.result as string;
      const emails = text.split(/[\r\n,;]+/).map(s => s.trim()).filter(s => s.includes('@'));
      setEvParticipants(emails);
    };
    reader.readAsText(file);
  };

  const handleAddTemplate = () => {
    const next = [...evTemplates, { label: `Template ${evTemplates.length + 1}`, imageUrl: '', order: evTemplates.length }];
    setEvTemplates(next);
    syncEvContents(next);
  };

  const handleRemoveTemplate = (i: number) => {
    const next = evTemplates.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, order: idx }));
    setEvTemplates(next);
    syncEvContents(next);
    setEvPrizes(prev =>
      prev
        .filter(p => p.templateIndex !== i)
        .map(p => ({ ...p, templateIndex: p.templateIndex > i ? p.templateIndex - 1 : p.templateIndex }))
    );
  };

  const handleTemplateFileChange = async (i: number, file: File) => {
    setEvUploading(true);
    setEvErr('');
    try {
      const url = await uploadTemplateImage(file);
      setEvTemplates(prev => prev.map((t, idx) => idx === i ? { ...t, imageUrl: url } : t));
    } catch (e) {
      setEvErr(`Upload failed: ${String(e)}`);
    } finally {
      setEvUploading(false);
    }
  };

  const submitEvCert = async () => {
    setEvErr('');
    if (!evProgramId) { setEvErr('Select an event / program.'); return; }
    if (evTemplates.length === 0) { setEvErr('Add at least one certificate template.'); return; }
    if (evTemplates.some(t => !t.imageUrl)) { setEvErr('Upload images for all templates before saving.'); return; }

    const program = programs.find(p => p._id === evProgramId);
    const payload = {
      programId:    evProgramId,
      programName:  program?.name ?? '',
      templates:    evTemplates,
      participants: evParticipants,
      prizes:       evPrizes,
      contents:     evContents,
    };

    setEvSaving(true);
    try {
      const url    = evEditing ? `/api/event-certificates/${evEditing}` : '/api/event-certificates';
      const method = evEditing ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (data.success) {
        setEvSuccess(evEditing ? 'Updated successfully.' : 'Event certificate config saved.');
        resetEvForm(); setEvShowForm(false); fetchEvCerts();
      } else {
        setEvErr(data.message ?? 'Save failed.');
      }
    } catch {
      setEvErr('Network error.');
    } finally {
      setEvSaving(false);
    }
  };

  const deleteEvCert = async (id: string) => {
    if (!confirm('Delete this event certificate config?')) return;
    try {
      await fetch(`/api/event-certificates/${id}`, { method: 'DELETE' });
      fetchEvCerts();
    } catch { /* ignore */ }
  };

  const startEditEvCert = (doc: EvCertDoc) => {
    setEvEditing(doc._id);
    setEvProgramId(doc.programId);
    setEvTemplates(doc.templates ?? []);
    setEvParticipants(doc.participants ?? []);
    setEvPrizes(doc.prizes ?? []);
    setEvContents(doc.contents ?? []);
    setEvShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) { setAuthErr('Enter admin key.'); return; }
    setAuthErr('');
    setAuthed(true);
    fetchReferrals(adminKey);
    fetchCerts();
  };

  useEffect(() => {
    if (authed && tab === 'referrals')  fetchReferrals(adminKey);
    if (authed && tab === 'certs')      fetchCerts();
    if (authed && tab === 'emails')     fetchEmailStats();
    if (authed && tab === 'offers')     fetchOfferCodes(adminKey);
    if (authed && tab === 'eventcerts') { fetchEvCerts(); fetchPrograms(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className={styles.loginShell}>
        <div className={styles.loginCard}>
          <Image src="/logo.png" alt="Skillinf" width={120} height={32} style={{ objectFit: 'contain', marginBottom: 24 }} />
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
        <Image src="/logo.png" alt="Skillinf" width={110} height={28} style={{ objectFit: 'contain' }} />
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
        <button className={`${styles.tab} ${tab === 'offers' ? styles.tabActive : ''}`} onClick={() => setTab('offers')}>
          Offer Codes
        </button>
        <button className={`${styles.tab} ${tab === 'eventcerts' ? styles.tabActive : ''}`} onClick={() => setTab('eventcerts')}>
          Event Certificates
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
              <div className={styles.tableScroll}>
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
              <div className={styles.tableScroll}>
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

        {/* ── Offer Codes Tab ── */}
        {tab === 'offers' && (
          <div>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>🏷️ Offer Code Management</h2>
                <p className={styles.sectionSub}>Create discount offer codes with time-based or count-based expiry.</p>
              </div>
              <button className={styles.refreshBtn} onClick={() => fetchOfferCodes(adminKey)} disabled={offerLoading}>
                {offerLoading ? 'Loading…' : '↻ Refresh'}
              </button>
            </div>

            {/* ── Create form ── */}
            <div className={styles.offerForm}>
              <h3 className={styles.offerFormTitle}>✨ Create New Offer Code</h3>

              {/* Row 1: Discount % */}
              <div className={styles.offerRow}>
                <label className={styles.offerLabel}>Discount Percentage</label>
                <div className={styles.offerInputWrap}>
                  <input
                    id="offer-discount"
                    type="number"
                    min={1} max={100}
                    className={styles.offerInput}
                    placeholder="e.g. 20"
                    value={offerDiscount}
                    onChange={e => setOfferDiscount(e.target.value)}
                  />
                  <span className={styles.offerInputSuffix}>%</span>
                </div>
              </div>

              {/* Row 2: Limit type dropdown */}
              <div className={styles.offerRow}>
                <label className={styles.offerLabel}>Expiry Type</label>
                <select
                  id="offer-limit-type"
                  className={styles.offerSelect}
                  value={offerLimitType}
                  onChange={e => setOfferLimitType(e.target.value as 'time' | 'count')}
                >
                  <option value="time">⏰ Time-based (expires at a date & time)</option>
                  <option value="count">🔢 Count-based (expires after N uses)</option>
                </select>
              </div>

              {/* Row 3: Time OR Count input */}
              {offerLimitType === 'time' ? (
                <div className={styles.offerRow}>
                  <label className={styles.offerLabel}>End Date &amp; Time</label>
                  <input
                    id="offer-end-date"
                    type="datetime-local"
                    className={styles.offerInput}
                    value={offerEndDate}
                    onChange={e => setOfferEndDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {offerEndDate && (
                    <div className={styles.offerTimePreview}>
                      <span className={styles.offerTimeChip}>🟢 Starts: <strong>Now</strong></span>
                      <span className={styles.offerTimeArrow}>→</span>
                      <span className={styles.offerTimeChip}>🔴 Expires: <strong>{new Date(offerEndDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.offerRow}>
                  <label className={styles.offerLabel}>Maximum Usage Count</label>
                  <div className={styles.offerInputWrap}>
                    <input
                      id="offer-max-count"
                      type="number"
                      min={1}
                      className={styles.offerInput}
                      placeholder="e.g. 50"
                      value={offerCount}
                      onChange={e => setOfferCount(e.target.value)}
                    />
                    <span className={styles.offerInputSuffix}>uses</span>
                  </div>
                  <p className={styles.offerHint}>Code will auto-deactivate after this many successful uses.</p>
                </div>
              )}

              {/* Errors & success */}
              {offerErr     && <p className={styles.offerErr}>{offerErr}</p>}
              {offerSuccess && !generatedCode && <p className={styles.offerSuccessMsg}>{offerSuccess}</p>}

              {/* Generated code display */}
              {generatedCode && (
                <div className={styles.codeReveal}>
                  <span className={styles.codeRevealLabel}>🎉 Your new offer code</span>
                  <span className={styles.codeRevealCode}>{generatedCode}</span>
                  <button
                    className={styles.codeCopyBtn}
                    onClick={() => { navigator.clipboard.writeText(generatedCode); }}
                  >
                    Copy
                  </button>
                </div>
              )}

              {/* Submit button */}
              <button
                id="offer-create-btn"
                className={styles.offerCreateBtn}
                onClick={createOfferCode}
                disabled={offerCreating}
              >
                {offerCreating ? 'Creating…' : '✨ Create Offer Code'}
              </button>
            </div>

            {/* ── Active codes list ── */}
            <div style={{ marginTop: 32 }}>
              <h3 className={styles.offerListTitle}>Active &amp; Past Offer Codes</h3>
              {offerLoading ? (
                <div className={styles.loading}>Loading offer codes…</div>
              ) : offerCodes.length === 0 ? (
                <div className={styles.empty}>No offer codes created yet.</div>
              ) : (
                <div className={styles.offerList}>
                  {offerCodes.map(oc => {
                    const isExpiredByTime = oc.limitType === 'time' && oc.endTime && new Date(oc.endTime) < new Date();
                    const isExpiredByCount = oc.limitType === 'count' && oc.maxCount !== undefined && oc.usedCount >= oc.maxCount;
                    const expired = isExpiredByTime || isExpiredByCount || !oc.active;
                    return (
                      <div key={oc._id} className={`${styles.offerCard} ${expired ? styles.offerCardExpired : ''}`}>
                        <div className={styles.offerCardTop}>
                          <div className={styles.offerCodeBadge}>{oc.code}</div>
                          <div className={styles.offerCardMeta}>
                            <span className={styles.offerDiscount}>{oc.discountPercent}% OFF</span>
                            <span className={`${styles.offerStatus} ${expired ? styles.offerStatusOff : styles.offerStatusOn}`}>
                              {expired ? '⛔ Inactive' : '✅ Active'}
                            </span>
                          </div>
                        </div>
                        <div className={styles.offerCardBody}>
                          {oc.limitType === 'time' && oc.endTime && (
                            <div className={styles.offerCardDetail}>
                              <span>⏰ <strong>Time-based</strong></span>
                              <span className={styles.offerCardDetailSub}>
                                Expires: {new Date(oc.endTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>
                          )}
                          {oc.limitType === 'count' && oc.maxCount !== undefined && (
                            <div className={styles.offerCardDetail}>
                              <span>🔢 <strong>Count-based</strong></span>
                              <span className={styles.offerCardDetailSub}>
                                {oc.usedCount} / {oc.maxCount} uses
                              </span>
                              <div className={styles.offerUsageBar}>
                                <div
                                  className={styles.offerUsageBarFill}
                                  style={{ width: `${Math.min(100, Math.round((oc.usedCount / oc.maxCount) * 100))}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <div className={styles.offerCardFooter}>
                            <span className={styles.offerCreatedAt}>Created: {new Date(oc.createdAt).toLocaleDateString('en-IN')}</span>
                            {oc.active && !isExpiredByTime && !isExpiredByCount && (
                              <button
                                className={styles.offerDeactivateBtn}
                                onClick={() => deactivateCode(oc._id)}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Event Certificates Tab ── */}
        {tab === 'eventcerts' && (
          <div>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Event Certificates</h2>
                <p className={styles.sectionSub}>
                  Create certificate configs for events. Participants can download their certificate from the user dashboard.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={styles.refreshBtn} onClick={fetchEvCerts} disabled={evLoading}>
                  {evLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  className={styles.refreshBtn}
                  style={{ background: '#0f172a', color: '#fff', borderColor: '#0f172a' }}
                  onClick={() => { resetEvForm(); setEvShowForm(v => !v); }}
                >
                  {evShowForm ? 'Cancel' : 'Add Certificate'}
                </button>
              </div>
            </div>

            {evSuccess && <p className={styles.offerSuccessMsg} style={{ marginTop: 12 }}>{evSuccess}</p>}

            {/* ── Add / Edit form ── */}
            {evShowForm && (
              <div className={styles.evForm}>
                <h3 className={styles.evFormTitle}>
                  {evEditing ? 'Edit Event Certificate Config' : 'New Event Certificate Config'}
                </h3>

                {/* Program picker */}
                <div className={styles.evRow}>
                  <label className={styles.evLabel}>Event / Program</label>
                  <select
                    className={styles.evSelect}
                    value={evProgramId}
                    onChange={e => setEvProgramId(e.target.value)}
                  >
                    <option value="">Select a program...</option>
                    {programs.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Certificate templates */}
                <div className={styles.evRow}>
                  <div className={styles.evLabelRow}>
                    <label className={styles.evLabel}>Certificate Templates</label>
                    <button className={styles.evAddBtn} onClick={handleAddTemplate} disabled={evUploading}>
                      + Add Template
                    </button>
                  </div>
                  {evTemplates.length === 0 && (
                    <p className={styles.evHint}>No templates yet. Add at least one template with a background image.</p>
                  )}
                  {evTemplates.map((t, i) => (
                    <div key={i} className={styles.evTemplateCard}>
                      <div className={styles.evTemplateCardHeader}>
                        <span className={styles.evTemplateBadge}>Template {i + 1}</span>
                        <button className={styles.evRemoveBtn} onClick={() => handleRemoveTemplate(i)}>Remove</button>
                      </div>
                      <div className={styles.evTwoCol}>
                        <div>
                          <label className={styles.evSubLabel}>Label (shown to users)</label>
                          <input
                            className={styles.evInput}
                            value={t.label}
                            onChange={e => {
                              const v = e.target.value;
                              setEvTemplates(prev => prev.map((x, idx) => idx === i ? { ...x, label: v } : x));
                            }}
                            placeholder="e.g. Participant Certificate"
                          />
                        </div>
                        <div>
                          <label className={styles.evSubLabel}>Background Image (landscape)</label>
                          <input
                            className={styles.evInput}
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleTemplateFileChange(i, f);
                            }}
                          />
                          {evUploading && <p className={styles.evHint}>Uploading...</p>}
                          {t.imageUrl && !evUploading && (
                            <p className={styles.evHint}>Saved: {t.imageUrl}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Participants CSV */}
                <div className={styles.evRow}>
                  <label className={styles.evLabel}>Participants (upload CSV or TXT of emails)</label>
                  <input
                    className={styles.evInput}
                    type="file"
                    accept=".csv,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleEvCsvUpload(f); }}
                  />
                  {evParticipants.length > 0 && (
                    <p className={styles.evHint}>
                      {evParticipants.length} participant email{evParticipants.length !== 1 ? 's' : ''} loaded.
                    </p>
                  )}
                </div>

                {/* Prize winners */}
                <div className={styles.evRow}>
                  <div className={styles.evLabelRow}>
                    <label className={styles.evLabel}>Prize Winners</label>
                    <button
                      className={styles.evAddBtn}
                      onClick={() => setEvPrizes(prev => [
                        ...prev,
                        { prizeLabel: '1st Prize', email: '', templateIndex: Math.min(1, evTemplates.length - 1) },
                      ])}
                    >
                      + Add Prize
                    </button>
                  </div>
                  {evPrizes.length === 0 && (
                    <p className={styles.evHint}>Prizes are optional. Add rows for 1st, 2nd, 3rd prize winners etc.</p>
                  )}
                  {evPrizes.map((pz, i) => (
                    <div key={i} className={styles.evPrizeCard}>
                      <div className={styles.evThreeCol}>
                        <div>
                          <label className={styles.evSubLabel}>Prize Label</label>
                          <input
                            className={styles.evInput}
                            value={pz.prizeLabel}
                            onChange={e => {
                              const v = e.target.value;
                              setEvPrizes(prev => prev.map((x, idx) => idx === i ? { ...x, prizeLabel: v } : x));
                            }}
                            placeholder="e.g. 1st Prize"
                          />
                        </div>
                        <div>
                          <label className={styles.evSubLabel}>Winner Email</label>
                          <input
                            className={styles.evInput}
                            type="email"
                            value={pz.email}
                            onChange={e => {
                              const v = e.target.value;
                              setEvPrizes(prev => prev.map((x, idx) => idx === i ? { ...x, email: v } : x));
                            }}
                            placeholder="winner@example.com"
                          />
                        </div>
                        <div>
                          <label className={styles.evSubLabel}>Certificate Template</label>
                          <select
                            className={styles.evSelect}
                            value={pz.templateIndex}
                            onChange={e => {
                              const v = Number(e.target.value);
                              setEvPrizes(prev => prev.map((x, idx) => idx === i ? { ...x, templateIndex: v } : x));
                            }}
                          >
                            {evTemplates.map((t, ti) => (
                              <option key={ti} value={ti}>{t.label || `Template ${ti + 1}`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        className={styles.evRemoveBtn}
                        style={{ marginTop: 10 }}
                        onClick={() => setEvPrizes(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Certificate content per template */}
                {evTemplates.length > 0 && (
                  <div className={styles.evRow}>
                    <label className={styles.evLabel}>Certificate Content (per template)</label>
                    <p className={styles.evHint}>
                      Canvas is landscape 1123 x 794 px. Top text anchors near the top, body text near the bottom.
                      Use the slider to set the vertical position of the participant name.
                    </p>
                    {evContents.map((c, i) => (
                      <div key={i} className={styles.evContentCard}>
                        <div className={styles.evContentCardHeader}>
                          {evTemplates[c.templateIndex]?.label || `Template ${c.templateIndex + 1}`}
                        </div>

                        {/* Top text */}
                        <div className={styles.evSubSection}>
                          <span className={styles.evSubSectionLabel}>Top Text (above name)</span>
                          <textarea
                            className={styles.evTextarea}
                            rows={3}
                            value={c.topText}
                            onChange={e => {
                              const v = e.target.value;
                              setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, topText: v } : x));
                            }}
                            placeholder="Text displayed above the participant name..."
                          />
                          <div className={styles.evInlineRow}>
                            <div>
                              <label className={styles.evSubLabel}>Font size (px)</label>
                              <input
                                type="number" min={10} max={120}
                                className={styles.evInputSm}
                                value={c.topFontSize}
                                onChange={e => {
                                  const v = Number(e.target.value);
                                  setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, topFontSize: v } : x));
                                }}
                              />
                            </div>
                            <div>
                              <label className={styles.evSubLabel}>Text colour</label>
                              <input
                                type="color"
                                className={styles.evColorInput}
                                value={c.topColor}
                                onChange={e => {
                                  const v = e.target.value;
                                  setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, topColor: v } : x));
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Name */}
                        <div className={styles.evSubSection}>
                          <span className={styles.evSubSectionLabel}>Participant Name Position</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                            <input
                              type="range" min={10} max={90}
                              className={styles.evSlider}
                              value={c.nameYPercent}
                              onChange={e => {
                                const v = Number(e.target.value);
                                setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, nameYPercent: v } : x));
                              }}
                            />
                            <span className={styles.evSliderVal}>{c.nameYPercent}% from top</span>
                          </div>
                          <div className={styles.evInlineRow}>
                            <div>
                              <label className={styles.evSubLabel}>Font size (px)</label>
                              <input
                                type="number" min={10} max={200}
                                className={styles.evInputSm}
                                value={c.nameFontSize}
                                onChange={e => {
                                  const v = Number(e.target.value);
                                  setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, nameFontSize: v } : x));
                                }}
                              />
                            </div>
                            <div>
                              <label className={styles.evSubLabel}>Name colour</label>
                              <input
                                type="color"
                                className={styles.evColorInput}
                                value={c.nameColor}
                                onChange={e => {
                                  const v = e.target.value;
                                  setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, nameColor: v } : x));
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Body text */}
                        <div className={styles.evSubSection}>
                          <span className={styles.evSubSectionLabel}>Body Text (below name)</span>
                          <textarea
                            className={styles.evTextarea}
                            rows={3}
                            value={c.bodyText}
                            onChange={e => {
                              const v = e.target.value;
                              setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, bodyText: v } : x));
                            }}
                            placeholder="Text displayed below the participant name..."
                          />
                          <div className={styles.evInlineRow}>
                            <div>
                              <label className={styles.evSubLabel}>Font size (px)</label>
                              <input
                                type="number" min={10} max={120}
                                className={styles.evInputSm}
                                value={c.bodyFontSize}
                                onChange={e => {
                                  const v = Number(e.target.value);
                                  setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, bodyFontSize: v } : x));
                                }}
                              />
                            </div>
                            <div>
                              <label className={styles.evSubLabel}>Text colour</label>
                              <input
                                type="color"
                                className={styles.evColorInput}
                                value={c.bodyColor}
                                onChange={e => {
                                  const v = e.target.value;
                                  setEvContents(prev => prev.map((x, idx) => idx === i ? { ...x, bodyColor: v } : x));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {evErr && <p className={styles.offerErr}>{evErr}</p>}

                <button
                  className={styles.evSubmitBtn}
                  onClick={submitEvCert}
                  disabled={evSaving || evUploading}
                >
                  {evSaving ? 'Saving...' : evEditing ? 'Update Certificate Config' : 'Save Certificate Config'}
                </button>
              </div>
            )}

            {/* ── List ── */}
            <div style={{ marginTop: evShowForm ? 32 : 4 }}>
              {evLoading ? (
                <div className={styles.loading}>Loading event certificates...</div>
              ) : evCerts.length === 0 ? (
                <div className={styles.empty}>No event certificate configs created yet.</div>
              ) : (
                <div className={styles.evList}>
                  {evCerts.map(doc => (
                    <div key={doc._id} className={styles.evListCard}>
                      <div className={styles.evListCardMain}>
                        <div className={styles.evListCardTitle}>{doc.programName}</div>
                        <div className={styles.evListCardMeta}>
                          {doc.templates?.length ?? 0} template{doc.templates?.length !== 1 ? 's' : ''}
                          &nbsp;&middot;&nbsp;
                          {doc.participants?.length ?? 0} participant{doc.participants?.length !== 1 ? 's' : ''}
                          &nbsp;&middot;&nbsp;
                          {doc.prizes?.length ?? 0} prize winner{doc.prizes?.length !== 1 ? 's' : ''}
                        </div>
                        <div className={styles.evListCardDate}>
                          Created: {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div className={styles.evListCardActions}>
                        <button className={styles.evEditBtn} onClick={() => startEditEvCert(doc)}>Edit</button>
                        <button className={styles.evDeleteBtn} onClick={() => deleteEvCert(doc._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
