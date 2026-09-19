'use client';

import React, { useEffect, useState } from 'react';
import { Users, Loader2, AlertCircle, Search, Gift } from 'lucide-react';
import styles from './Referrals.module.css';

interface ReferralEntry {
  email: string;
  name: string;
  myReferralCode: string;
  referredCount: number;
  referredMembers: string[];
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);

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

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Gift size={22} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Referral Management</h1>
            <p className={styles.subtitle}>Track all user referral codes and how many members each person referred</p>
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
        <div className={styles.center}><Loader2 size={28} className={styles.spin} /><p>Loading referrals…</p></div>
      ) : error ? (
        <div className={styles.center}><AlertCircle size={28} color="#ef4444"/><p>{error}</p></div>
      ) : filtered.length === 0 ? (
        <div className={styles.center}><Users size={40} color="#cbd5e1"/><p>No referral data found.</p></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Referral Code</th>
                <th>Referred Count</th>
                <th>Referred Members</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <React.Fragment key={r.email}>
                  <tr className={r.referredCount > 0 ? styles.rowActive : ''}>
                    <td className={styles.num}>{i + 1}</td>
                    <td className={styles.name}>{r.name}</td>
                    <td className={styles.email}>{r.email}</td>
                    <td>
                      <span className={styles.codeBadge}>{r.myReferralCode}</span>
                    </td>
                    <td>
                      <span className={`${styles.countBadge} ${r.referredCount > 0 ? styles.countActive : ''}`}>
                        {r.referredCount}
                      </span>
                    </td>
                    <td>
                      {r.referredCount > 0 ? (
                        <button
                          className={styles.viewBtn}
                          onClick={() => setExpanded(expanded === r.email ? null : r.email)}
                        >
                          {expanded === r.email ? 'Hide' : `View ${r.referredCount}`}
                        </button>
                      ) : (
                        <span className={styles.none}>—</span>
                      )}
                    </td>
                  </tr>
                  {expanded === r.email && r.referredMembers.length > 0 && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={6}>
                        <div className={styles.membersList}>
                          <p className={styles.membersTitle}>Members who used <strong>{r.myReferralCode}</strong>:</p>
                          <ul>
                            {r.referredMembers.map(m => <li key={m}>{m}</li>)}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
