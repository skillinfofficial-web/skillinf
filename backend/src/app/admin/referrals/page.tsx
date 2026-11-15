'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Loader2, AlertCircle, Search, Gift, Ticket, Send, CheckCircle2 } from 'lucide-react';
import styles from './Referrals.module.css';

interface ReferredMember {
  email: string;
  name: string;
  domain: string;
  linkedinVerified: boolean;
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  eCertPaid: boolean;
}

interface ReferralEntry {
  email: string;
  name: string;
  myReferralCode: string;
  referredCount: number;
  referredMembers: ReferredMember[];
}

const STEP_COLS = [
  { key: 'linkedinVerified' as const, short: 'LI',  title: 'LinkedIn Verified', color: '#0a66c2' },
  { key: 'step1'            as const, short: 'W1',  title: 'Week 1 Done',       color: '#7c3aed' },
  { key: 'step2'            as const, short: 'W2',  title: 'Week 2 Done',       color: '#7c3aed' },
  { key: 'step3'            as const, short: 'W3',  title: 'Week 3 Done',       color: '#7c3aed' },
  { key: 'step4'            as const, short: 'W4',  title: 'Week 4 Done',       color: '#7c3aed' },
  { key: 'eCertPaid'        as const, short: 'Cert',title: 'Certificate Paid',  color: '#059669' },
];

function Tick({ done, color, title }: { done: boolean; color: string; title: string }) {
  return (
    <div
      title={title + (done ? ': Done' : ': Pending')}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        background: done ? color : '#f1f5f9',
        border: `1.5px solid ${done ? color : '#e2e8f0'}`,
        transition: 'background 0.15s',
      }}
    >
      {done && (
        <svg viewBox="0 0 12 10" fill="none" width={10} height={10}>
          <path d="M1 5l3 4 7-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

interface CouponState {
  pct: string;             // kept as string so the user can type freely
  generating: boolean;
  generatedCode: string;
  genError: string;
  sending: boolean;
  sendResult: { ok: boolean; msg: string } | null;
}

const defaultCoupon = (): CouponState => ({
  pct: '', generating: false, generatedCode: '',
  genError: '', sending: false, sendResult: null,
});

/* ─────────────────────────────────────────────────────────────────────────────
   CouponPanel is a TOP-LEVEL component (outside ReferralsPage) so React never
   unmounts / remounts it on parent re-renders — which was causing the input to
   lose focus after every keystroke.
───────────────────────────────────────────────────────────────────────────── */
interface CouponPanelProps {
  email: string;
  name: string;
  coupon: CouponState;
  onPctChange: (email: string, pct: string) => void;
  onGenerate: (email: string) => void;
  onSend: (email: string) => void;
}

function CouponPanel({ email, name, coupon: c, onPctChange, onGenerate, onSend }: CouponPanelProps) {
  return (
    <div className={styles.couponPanel}>
      <p className={styles.couponTitle}><Ticket size={13} /> Generate Referral Coupon</p>

      <div className={styles.couponRow}>
        <div className={styles.couponInputWrap}>
          <input
            type="number"
            min={1}
            max={100}
            className={styles.couponInput}
            placeholder="Discount %"
            value={c.pct}
            onChange={e => onPctChange(email, e.target.value)}
          />
          <span className={styles.couponPctLabel}>%</span>
        </div>
        <button
          className={styles.generateBtn}
          onClick={() => onGenerate(email)}
          disabled={c.generating || !c.pct}
        >
          {c.generating
            ? <><Loader2 size={13} className={styles.spin} /> Generating…</>
            : 'Generate Coupon'}
        </button>
      </div>

      {c.genError && <p className={styles.couponErr}>{c.genError}</p>}

      {c.generatedCode && (
        <div className={styles.generatedWrap}>
          <div className={styles.generatedCode}>
            <span className={styles.generatedLabel}>Coupon Code</span>
            <span className={styles.generatedValue}>{c.generatedCode}</span>
            <span className={styles.generatedPct}>{c.pct}% OFF · One-time use</span>
          </div>
          <button
            className={styles.sendMailBtn}
            onClick={() => onSend(email)}
            disabled={c.sending || c.sendResult?.ok === true}
          >
            {c.sending
              ? <><Loader2 size={13} className={styles.spin} /> Sending…</>
              : c.sendResult?.ok
                ? <><CheckCircle2 size={13} /> Mail Sent</>
                : <><Send size={13} /> Send Coupon Mail</>}
          </button>
          {c.sendResult && (
            <p className={`${styles.sendResult} ${c.sendResult.ok ? styles.sendOk : styles.sendErr}`}>
              {c.sendResult.msg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);

  // Per-row coupon state keyed by email
  const [coupons, setCoupons] = useState<Record<string, CouponState>>({});

  const getCoupon = (email: string): CouponState =>
    coupons[email] ?? defaultCoupon();

  const patchCoupon = useCallback((email: string, patch: Partial<CouponState>) =>
    setCoupons(prev => ({
      ...prev,
      [email]: { ...(prev[email] ?? defaultCoupon()), ...patch },
    })), []);

  /* ── Only update pct — reset generated code when user changes the % ── */
  const handlePctChange = useCallback((email: string, pct: string) => {
    setCoupons(prev => ({
      ...prev,
      [email]: {
        ...(prev[email] ?? defaultCoupon()),
        pct,
        genError: '',
        generatedCode: '',
        sendResult: null,
      },
    }));
  }, []);

  useEffect(() => {
    fetch('/api/referrals')
      .then(r => r.json())
      .then(d => {
        if (d.success) setReferrals(d.referrals);
        else setError(d.message || 'Failed to load referrals.');
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = referrals.filter(r =>
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.myReferralCode.toLowerCase().includes(search.toLowerCase())
  );

  const totalReferrals = referrals.reduce((s, r) => s + r.referredCount, 0);

  /* ── Generate coupon ── */
  const handleGenerate = useCallback(async (email: string) => {
    const entry = referrals.find(r => r.email === email);
    if (!entry) return;
    const c   = getCoupon(email);  // read current state via closure — fine for one-shot action
    const pct = Number(c.pct);
    if (!pct || pct < 1 || pct > 100) {
      patchCoupon(email, { genError: 'Enter a discount between 1 and 100.' });
      return;
    }
    patchCoupon(email, { generating: true, genError: '', generatedCode: '', sendResult: null });
    try {
      const res  = await fetch('/api/referrals/generate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: entry.email, name: entry.name, discountPercent: pct }),
      });
      const data = await res.json();
      if (data.success) {
        patchCoupon(email, { generatedCode: data.code, genError: '' });
      } else {
        patchCoupon(email, { genError: data.message || 'Failed to generate coupon.' });
      }
    } catch {
      patchCoupon(email, { genError: 'Network error.' });
    } finally {
      patchCoupon(email, { generating: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrals, coupons, patchCoupon]);

  /* ── Send coupon email ── */
  const handleSend = useCallback(async (email: string) => {
    const entry = referrals.find(r => r.email === email);
    if (!entry) return;
    const c = getCoupon(email);
    if (!c.generatedCode) return;
    patchCoupon(email, { sending: true, sendResult: null });
    try {
      const res  = await fetch('/api/referrals/send-coupon-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: entry.email, name: entry.name,
          code: c.generatedCode, discountPercent: Number(c.pct),
        }),
      });
      const data = await res.json();
      patchCoupon(email, { sendResult: { ok: data.success, msg: data.message } });
    } catch {
      patchCoupon(email, { sendResult: { ok: false, msg: 'Network error.' } });
    } finally {
      patchCoupon(email, { sending: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrals, coupons, patchCoupon]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Gift size={22} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Referral Management</h1>
            <p className={styles.subtitle}>Track referrals and generate reward coupons for each member</p>
          </div>
        </div>
        <div className={styles.statPills}>
          <div className={styles.pill}><Users size={14} /> {referrals.length} Members</div>
          <div className={`${styles.pill} ${styles.pillGreen}`}><Gift size={14} /> {totalReferrals} Referrals</div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search by name, email or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.center}><Loader2 size={28} className={styles.spin} /><p>Loading referrals…</p></div>
      ) : error ? (
        <div className={styles.center}><AlertCircle size={28} color="#ef4444" /><p>{error}</p></div>
      ) : filtered.length === 0 ? (
        <div className={styles.center}><Users size={40} color="#cbd5e1" /><p>No referral data found.</p></div>
      ) : (
        <>
          {/* Desktop — table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Referral Code</th>
                  <th>Referred</th>
                  <th>Members</th>
                  <th>Coupon</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <React.Fragment key={r.email}>
                    <tr className={r.referredCount > 0 ? styles.rowActive : ''}>
                      <td className={styles.num}>{i + 1}</td>
                      <td className={styles.name}>{r.name}</td>
                      <td className={styles.email}>{r.email}</td>
                      <td><span className={styles.codeBadge}>{r.myReferralCode}</span></td>
                      <td>
                        <span className={`${styles.countBadge} ${r.referredCount > 0 ? styles.countActive : ''}`}>
                          {r.referredCount}
                        </span>
                      </td>
                      <td>
                        {r.referredCount > 0 ? (
                          <button className={styles.viewBtn} onClick={() => setExpanded(expanded === r.email ? null : r.email)}>
                            {expanded === r.email ? 'Hide' : `View ${r.referredCount}`}
                          </button>
                        ) : (
                          <span className={styles.none}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={styles.couponToggleBtn}
                          onClick={() => setExpanded(expanded === `cp_${r.email}` ? null : `cp_${r.email}`)}
                        >
                          <Ticket size={13} /> {expanded === `cp_${r.email}` ? 'Hide' : 'Coupon'}
                        </button>
                      </td>
                    </tr>

                    {/* Members expansion */}
                    {expanded === r.email && r.referredMembers.length > 0 && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={7}>
                          <div className={styles.membersList}>
                            <p className={styles.membersTitle}>Members who used <strong>{r.myReferralCode}</strong>:</p>
                            <div className={styles.membersTable}>
                              {/* Header */}
                              <div className={styles.membersTableHead}>
                                <span className={styles.memberCol}>Member</span>
                                {STEP_COLS.map(s => (
                                  <span key={s.key} className={styles.tickCol} title={s.title}>{s.short}</span>
                                ))}
                                <span className={styles.progressCol}>Progress</span>
                              </div>
                              {/* Rows */}
                              {r.referredMembers.map(m => {
                                const done = STEP_COLS.filter(s => m[s.key]).length;
                                return (
                                  <div key={m.email} className={styles.membersTableRow}>
                                    <span className={styles.memberCol}>
                                      <span className={styles.memberName}>{m.name}</span>
                                      <span className={styles.memberEmail}>{m.email}</span>
                                      {m.domain && <span className={styles.memberDomain}>{m.domain}</span>}
                                    </span>
                                    {STEP_COLS.map((s, idx) => (
                                      <span key={s.key} className={styles.tickCol}>
                                        <Tick done={m[s.key]} color={s.color} title={s.title} />
                                      </span>
                                    ))}
                                    <span className={styles.progressCol}>
                                      <span className={styles.progressBar}>
                                        <span
                                          className={styles.progressFill}
                                          style={{ width: `${Math.round(done / STEP_COLS.length * 100)}%` }}
                                        />
                                      </span>
                                      <span className={styles.progressLabel}>{done}/{STEP_COLS.length}</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Coupon panel expansion */}
                    {expanded === `cp_${r.email}` && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={7}>
                          <CouponPanel
                            email={r.email}
                            name={r.name}
                            coupon={getCoupon(r.email)}
                            onPctChange={handlePctChange}
                            onGenerate={handleGenerate}
                            onSend={handleSend}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — cards */}
          <div className={styles.cardList}>
            {filtered.map(r => (
              <div key={r.email} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <p className={styles.cardNameVal}>{r.name}</p>
                    <p className={styles.cardEmailVal}>{r.email}</p>
                  </div>
                  <span className={`${styles.countBadge} ${r.referredCount > 0 ? styles.countActive : ''}`}>
                    {r.referredCount}
                  </span>
                </div>
                <div className={styles.cardRows}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLabel}>Code</span>
                    <span className={styles.cardRowValue}>
                      <span className={styles.codeBadge}>{r.myReferralCode}</span>
                    </span>
                  </div>
                  {r.referredCount > 0 && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardRowLabel}>Members</span>
                      <span className={styles.cardRowValue}>
                        <button className={styles.viewBtn} onClick={() => setExpanded(expanded === r.email ? null : r.email)}>
                          {expanded === r.email ? 'Hide' : `View ${r.referredCount}`}
                        </button>
                      </span>
                    </div>
                  )}
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLabel}>Coupon</span>
                    <span className={styles.cardRowValue}>
                      <button
                        className={styles.couponToggleBtn}
                        onClick={() => setExpanded(expanded === `cp_${r.email}` ? null : `cp_${r.email}`)}
                      >
                        <Ticket size={13} /> {expanded === `cp_${r.email}` ? 'Hide' : 'Generate'}
                      </button>
                    </span>
                  </div>
                </div>
                {expanded === r.email && r.referredMembers.length > 0 && (
                  <div className={styles.membersList} style={{ marginTop: 12 }}>
                    <p className={styles.membersTitle}>Members who used <strong>{r.myReferralCode}</strong>:</p>
                    <div className={styles.membersTable}>
                      {r.referredMembers.map(m => {
                        const done = STEP_COLS.filter(s => m[s.key]).length;
                        return (
                          <div key={m.email} className={styles.membersTableRowMobile}>
                            <div className={styles.memberMobileTop}>
                              <span className={styles.memberName}>{m.name}</span>
                              {m.domain && <span className={styles.memberDomain}>{m.domain}</span>}
                            </div>
                            <span className={styles.memberEmail}>{m.email}</span>
                            <div className={styles.tickRowMobile}>
                              {STEP_COLS.map(s => (
                                <Tick key={s.key} done={m[s.key]} color={s.color} title={s.title} />
                              ))}
                              <span className={styles.progressLabel}>{done}/{STEP_COLS.length}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {expanded === `cp_${r.email}` && (
                  <div style={{ marginTop: 12 }}>
                    <CouponPanel
                      email={r.email}
                      name={r.name}
                      coupon={getCoupon(r.email)}
                      onPctChange={handlePctChange}
                      onGenerate={handleGenerate}
                      onSend={handleSend}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
