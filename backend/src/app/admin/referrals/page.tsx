'use client';

import React, { useEffect, useState } from 'react';
import { Users, Loader2, AlertCircle, Search, Gift, Ticket, Send, CheckCircle2 } from 'lucide-react';
import styles from './Referrals.module.css';

interface ReferralEntry {
  email: string;
  name: string;
  myReferralCode: string;
  referredCount: number;
  referredMembers: string[];
}

interface CouponState {
  pct: string;             // input value (string so user can type freely)
  generating: boolean;
  generatedCode: string;   // set after successful generation
  genError: string;
  sending: boolean;
  sendResult: { ok: boolean; msg: string } | null;
}

const defaultCoupon = (): CouponState => ({
  pct: '', generating: false, generatedCode: '',
  genError: '', sending: false, sendResult: null,
});

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

  const patchCoupon = (email: string, patch: Partial<CouponState>) =>
    setCoupons(prev => ({
      ...prev,
      [email]: { ...(prev[email] ?? defaultCoupon()), ...patch },
    }));

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
  const generateCoupon = async (r: ReferralEntry) => {
    const c = getCoupon(r.email);
    const pct = Number(c.pct);
    if (!pct || pct < 1 || pct > 100) {
      patchCoupon(r.email, { genError: 'Enter a discount between 1 and 100.' });
      return;
    }
    patchCoupon(r.email, { generating: true, genError: '', generatedCode: '', sendResult: null });
    try {
      const res  = await fetch('/api/referrals/generate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: r.email, name: r.name, discountPercent: pct }),
      });
      const data = await res.json();
      if (data.success) {
        patchCoupon(r.email, { generatedCode: data.code, genError: '' });
      } else {
        patchCoupon(r.email, { genError: data.message || 'Failed to generate coupon.' });
      }
    } catch {
      patchCoupon(r.email, { genError: 'Network error.' });
    } finally {
      patchCoupon(r.email, { generating: false });
    }
  };

  /* ── Send coupon email ── */
  const sendCouponMail = async (r: ReferralEntry) => {
    const c = getCoupon(r.email);
    if (!c.generatedCode) return;
    patchCoupon(r.email, { sending: true, sendResult: null });
    try {
      const res  = await fetch('/api/referrals/send-coupon-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: r.email, name: r.name,
          code: c.generatedCode, discountPercent: Number(c.pct),
        }),
      });
      const data = await res.json();
      patchCoupon(r.email, { sendResult: { ok: data.success, msg: data.message } });
    } catch {
      patchCoupon(r.email, { sendResult: { ok: false, msg: 'Network error.' } });
    } finally {
      patchCoupon(r.email, { sending: false });
    }
  };

  /* ── Coupon panel rendered inside each row ── */
  const CouponPanel = ({ r }: { r: ReferralEntry }) => {
    const c = getCoupon(r.email);
    return (
      <div className={styles.couponPanel}>
        <p className={styles.couponTitle}><Ticket size={13}/> Generate Referral Coupon</p>
        <div className={styles.couponRow}>
          <div className={styles.couponInputWrap}>
            <input
              type="number"
              min={1}
              max={100}
              className={styles.couponInput}
              placeholder="Discount %"
              value={c.pct}
              onChange={e => patchCoupon(r.email, { pct: e.target.value, genError: '', generatedCode: '', sendResult: null })}
            />
            <span className={styles.couponPctLabel}>%</span>
          </div>
          <button
            className={styles.generateBtn}
            onClick={() => generateCoupon(r)}
            disabled={c.generating || !c.pct}
          >
            {c.generating
              ? <><Loader2 size={13} className={styles.spin}/> Generating…</>
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
              onClick={() => sendCouponMail(r)}
              disabled={c.sending || (c.sendResult?.ok === true)}
            >
              {c.sending
                ? <><Loader2 size={13} className={styles.spin}/> Sending…</>
                : c.sendResult?.ok
                  ? <><CheckCircle2 size={13}/> Mail Sent</>
                  : <><Send size={13}/> Send Coupon Mail</>
              }
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
  };

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
          <div className={styles.pill}><Users size={14}/> {referrals.length} Members</div>
          <div className={`${styles.pill} ${styles.pillGreen}`}><Gift size={14}/> {totalReferrals} Referrals</div>
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
        <div className={styles.center}><Loader2 size={28} className={styles.spin}/><p>Loading referrals…</p></div>
      ) : error ? (
        <div className={styles.center}><AlertCircle size={28} color="#ef4444"/><p>{error}</p></div>
      ) : filtered.length === 0 ? (
        <div className={styles.center}><Users size={40} color="#cbd5e1"/><p>No referral data found.</p></div>
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
                          <Ticket size={13}/> {expanded === `cp_${r.email}` ? 'Hide' : 'Coupon'}
                        </button>
                      </td>
                    </tr>

                    {/* Members expansion */}
                    {expanded === r.email && r.referredMembers.length > 0 && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={7}>
                          <div className={styles.membersList}>
                            <p className={styles.membersTitle}>Members who used <strong>{r.myReferralCode}</strong>:</p>
                            <ul>{r.referredMembers.map(m => <li key={m}>{m}</li>)}</ul>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Coupon panel expansion */}
                    {expanded === `cp_${r.email}` && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={7}>
                          <CouponPanel r={r} />
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
            {filtered.map((r, i) => (
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
                        <Ticket size={13}/> {expanded === `cp_${r.email}` ? 'Hide' : 'Generate'}
                      </button>
                    </span>
                  </div>
                </div>
                {expanded === r.email && r.referredMembers.length > 0 && (
                  <div className={styles.membersList} style={{ marginTop: 12 }}>
                    <p className={styles.membersTitle}>Members who used <strong>{r.myReferralCode}</strong>:</p>
                    <ul>{r.referredMembers.map(m => <li key={m}>{m}</li>)}</ul>
                  </div>
                )}
                {expanded === `cp_${r.email}` && (
                  <div style={{ marginTop: 12 }}>
                    <CouponPanel r={r} />
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
