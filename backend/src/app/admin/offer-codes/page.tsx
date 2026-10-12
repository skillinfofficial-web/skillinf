'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Ticket, Loader2, AlertCircle, CheckCircle2,
  Clock, Hash, PlusCircle, XCircle, Copy, Check, Power, PowerOff,
} from 'lucide-react';
import styles from './OfferCodes.module.css';

interface OfferCode {
  _id: string;
  code: string;
  label?: string;
  discountPercent: number;
  limitType: 'time' | 'count';
  active: boolean;
  usedCount: number;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  maxCount?: number;
}

export default function OfferCodesPage() {
  // ── List state ──────────────────────────────────────────────────────────
  const [codes,   setCodes]   = useState<OfferCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // ── Form state ──────────────────────────────────────────────────────────
  const [label,      setLabel]      = useState('');
  const [discount,   setDiscount]   = useState('');
  const [limitType,  setLimitType]  = useState<'time' | 'count'>('time');
  const [endDate,    setEndDate]    = useState('');
  const [maxCount,   setMaxCount]   = useState('');
  const [creating,   setCreating]   = useState(false);
  const [formErr,    setFormErr]    = useState('');
  const [newCode,    setNewCode]    = useState('');
  const [copied,     setCopied]     = useState(false);

  // ── Fetch codes ──────────────────────────────────────────────────────────
  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/offer-codes');
      const data = await res.json();
      if (data.success) setCodes(data.data);
      else setError(data.message || 'Failed to load offer codes.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  // ── Create code ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormErr('');
    setNewCode('');
    const pct = Number(discount);
    if (!pct || pct < 1 || pct > 100) { setFormErr('Discount must be between 1 and 100%.'); return; }
    if (limitType === 'time' && !endDate)  { setFormErr('Please select an end date & time.'); return; }
    if (limitType === 'count' && (!maxCount || Number(maxCount) < 1)) { setFormErr('Enter a valid usage count (minimum 1).'); return; }

    if (limitType === 'time') {
      const end = new Date(endDate);
      if (isNaN(end.getTime()) || end <= new Date()) { setFormErr('End date & time must be in the future.'); return; }
    }

    setCreating(true);
    try {
      const res  = await fetch('/api/offer-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim() || undefined,
          discountPercent: pct,
          limitType,
          limitValue: limitType === 'time' ? endDate : Number(maxCount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCode(data.code);
        setLabel('');
        setDiscount('');
        setEndDate('');
        setMaxCount('');
        fetchCodes();
      } else {
        setFormErr(data.message || 'Failed to create offer code.');
      }
    } catch {
      setFormErr('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // ── Toggle active (activate / deactivate) ────────────────────────────────
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (id: string, newActive: boolean) => {
    setToggling(id);
    try {
      await fetch(`/api/offer-codes?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });
      fetchCodes();
    } catch { /* ignore */ } finally {
      setToggling(null);
    }
  };


  // ── Copy to clipboard ────────────────────────────────────────────────────
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const activeCodes   = codes.filter(c => {
    if (!c.active) return false;
    if (c.limitType === 'time' && c.endTime && new Date(c.endTime) < new Date()) return false;
    if (c.limitType === 'count' && c.maxCount !== undefined && c.usedCount >= c.maxCount) return false;
    return true;
  });
  const inactiveCodes = codes.filter(c => !activeCodes.includes(c));

  const isExpired = (oc: OfferCode) => {
    if (!oc.active) return true;
    if (oc.limitType === 'time' && oc.endTime && new Date(oc.endTime) < new Date()) return true;
    if (oc.limitType === 'count' && oc.maxCount !== undefined && oc.usedCount >= oc.maxCount) return true;
    return false;
  };

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Ticket size={22} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Offer Codes</h1>
            <p className={styles.subtitle}>Create and manage discount offer codes with time or count-based expiry</p>
          </div>
        </div>
        <div className={styles.statPills}>
          <div className={styles.pill}><Ticket size={14} /> {codes.length} Total</div>
          <div className={`${styles.pill} ${styles.pillGreen}`}><CheckCircle2 size={14} /> {activeCodes.length} Active</div>
          <div className={`${styles.pill} ${styles.pillGray}`}><XCircle size={14} /> {inactiveCodes.length} Inactive</div>
        </div>
      </div>

      {/* ── Create Form ── */}
      <div className={styles.formCard}>
        <div className={styles.formTitle}>
          <PlusCircle size={18} className={styles.formTitleIcon} />
          <span>Create New Offer Code</span>
        </div>

        <div className={styles.formGrid}>
          {/* Label (purpose) — full width */}
          <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Label / Purpose <span className={styles.optionalTag}>(optional)</span></label>
            <input
              id="offer-label"
              type="text"
              className={styles.input}
              placeholder="e.g. Diwali offer, College batch discount, Referral promo…"
              value={label}
              onChange={e => setLabel(e.target.value)}
              maxLength={100}
            />
            <p className={styles.hint}>Helps you remember what this coupon code is for.</p>
          </div>

          {/* Discount % */}
          <div className={styles.field}>
            <label className={styles.label}>Discount Percentage</label>
            <div className={styles.inputWrap}>
              <input
                id="offer-discount"
                type="number"
                min={1} max={100}
                className={styles.input}
                placeholder="e.g. 20"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
              />
              <span className={styles.inputSuffix}>%</span>
            </div>
          </div>

          {/* Expiry type */}
          <div className={styles.field}>
            <label className={styles.label}>Expiry Type</label>
            <select
              id="offer-limit-type"
              className={styles.select}
              value={limitType}
              onChange={e => setLimitType(e.target.value as 'time' | 'count')}
            >
              <option value="time">⏰ Time-based (expires at date & time)</option>
              <option value="count">🔢 Count-based (expires after N uses)</option>
            </select>
          </div>

          {/* Conditional field */}
          {limitType === 'time' ? (
            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>End Date &amp; Time</label>
              <input
                id="offer-end-date"
                type="datetime-local"
                className={styles.input}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              {endDate && (
                <div className={styles.timePreview}>
                  <span className={styles.timeChip}><Clock size={13} /> Starts: <strong>Now</strong></span>
                  <span className={styles.timeArrow}>→</span>
                  <span className={`${styles.timeChip} ${styles.timeChipRed}`}>
                    <Clock size={13} /> Expires: <strong>{new Date(endDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Maximum Usage Count</label>
              <div className={styles.inputWrap}>
                <input
                  id="offer-max-count"
                  type="number"
                  min={1}
                  className={styles.input}
                  placeholder="e.g. 50"
                  value={maxCount}
                  onChange={e => setMaxCount(e.target.value)}
                />
                <span className={styles.inputSuffix}><Hash size={14} /> uses</span>
              </div>
              <p className={styles.hint}>Code auto-deactivates after this many successful redemptions.</p>
            </div>
          )}
        </div>

        {/* Errors */}
        {formErr && (
          <div className={styles.alertErr}>
            <AlertCircle size={16} /> {formErr}
          </div>
        )}

        {/* Generated code reveal */}
        {newCode && (
          <div className={styles.codeReveal}>
            <div className={styles.codeRevealLeft}>
              <span className={styles.codeRevealLabel}>🎉 New offer code generated!</span>
              <span className={styles.codeRevealCode}>{newCode}</span>
            </div>
            <button
              className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
              onClick={() => handleCopy(newCode)}
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          id="offer-create-btn"
          className={styles.createBtn}
          onClick={handleCreate}
          disabled={creating}
        >
          {creating
            ? <><Loader2 size={16} className={styles.spin} /> Creating…</>
            : <><PlusCircle size={16} /> Create Offer Code</>}
        </button>
      </div>

      {/* ── Codes list ── */}
      {loading ? (
        <div className={styles.center}><Loader2 size={28} className={styles.spin} /><p>Loading offer codes…</p></div>
      ) : error ? (
        <div className={styles.center}><AlertCircle size={28} color="#ef4444" /><p>{error}</p></div>
      ) : codes.length === 0 ? (
        <div className={styles.center}><Ticket size={40} color="#cbd5e1" /><p>No offer codes yet. Create your first one above.</p></div>
      ) : (
        <div className={styles.listSection}>
          <h2 className={styles.listTitle}>All Offer Codes <span className={styles.listCount}>{codes.length}</span></h2>

          {/* Desktop table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Code</th>
                  <th>Label</th>
                  <th>Discount</th>
                  <th>Type</th>
                  <th>Expiry / Limit</th>
                  <th>Uses</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((oc, i) => {
                  const expired = isExpired(oc);
                  return (
                    <tr key={oc._id} className={expired ? styles.rowExpired : ''}>
                      <td className={styles.num}>{i + 1}</td>
                      <td>
                        <div className={styles.codeCellWrap}>
                          <span className={styles.codeBadge}>{oc.code}</span>
                          <button className={styles.miniCopyBtn} onClick={() => handleCopy(oc.code)} title="Copy code">
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className={styles.labelCell}>{oc.label || <span className={styles.noneText}>—</span>}</td>
                      <td><span className={styles.discountBadge}>{oc.discountPercent}% OFF</span></td>
                      <td>
                        <span className={oc.limitType === 'time' ? styles.typeBadgeTime : styles.typeBadgeCount}>
                          {oc.limitType === 'time' ? '⏰ Time' : '🔢 Count'}
                        </span>
                      </td>
                      <td className={styles.expiryCell}>
                        {oc.limitType === 'time' && oc.endTime
                          ? new Date(oc.endTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                          : oc.limitType === 'count' && oc.maxCount !== undefined
                          ? `${oc.maxCount} uses max`
                          : '—'}
                      </td>
                      <td>
                        {oc.limitType === 'count' && oc.maxCount !== undefined ? (
                          <div className={styles.usageWrap}>
                            <span className={styles.usageText}>{oc.usedCount}/{oc.maxCount}</span>
                            <div className={styles.usageBar}>
                              <div
                                className={styles.usageBarFill}
                                style={{ width: `${Math.min(100, Math.round((oc.usedCount / oc.maxCount) * 100))}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className={styles.usageText}>{oc.usedCount}</span>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${expired ? styles.statusInactive : styles.statusActive}`}>
                          {expired ? '⛔ Inactive' : '✅ Active'}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{new Date(oc.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        {toggling === oc._id ? (
                          <span className={styles.noneText}><Loader2 size={14} className={styles.spin} /></span>
                        ) : oc.active ? (
                          <button
                            className={styles.deactivateBtn}
                            onClick={() => handleToggle(oc._id, false)}
                          >
                            <PowerOff size={13} /> Deactivate
                          </button>
                        ) : (
                          <button
                            className={styles.activateBtn}
                            onClick={() => handleToggle(oc._id, true)}
                          >
                            <Power size={13} /> Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={styles.cardList}>
            {codes.map(oc => {
              const expired = isExpired(oc);
              return (
                <div key={oc._id} className={`${styles.card} ${expired ? styles.cardExpired : ''}`}>
                  <div className={styles.cardTop}>
                    <span className={styles.codeBadge}>{oc.code}</span>
                    <div className={styles.cardTopRight}>
                      <span className={styles.discountBadge}>{oc.discountPercent}% OFF</span>
                      <span className={`${styles.statusBadge} ${expired ? styles.statusInactive : styles.statusActive}`}>
                        {expired ? '⛔' : '✅'}
                      </span>
                      <button className={styles.miniCopyBtn} onClick={() => handleCopy(oc.code)}><Copy size={12} /></button>
                    </div>
                  </div>
                  <div className={styles.cardRows}>
                    {oc.label && (
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Label</span>
                        <span className={styles.cardLabelValue}>{oc.label}</span>
                      </div>
                    )}
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Type</span>
                      <span>{oc.limitType === 'time' ? '⏰ Time-based' : '🔢 Count-based'}</span>
                    </div>
                    {oc.limitType === 'time' && oc.endTime && (
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Expires</span>
                        <span>{new Date(oc.endTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    )}
                    {oc.limitType === 'count' && oc.maxCount !== undefined && (
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Uses</span>
                        <span>{oc.usedCount} / {oc.maxCount}</span>
                      </div>
                    )}
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Created</span>
                      <span>{new Date(oc.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  {toggling === oc._id ? (
                    <div className={styles.cardActionRow}>
                      <Loader2 size={14} className={styles.spin} />
                    </div>
                  ) : oc.active ? (
                    <button
                      className={styles.deactivateBtn}
                      style={{ marginTop: 10, width: '100%' }}
                      onClick={() => handleToggle(oc._id, false)}
                    >
                      <PowerOff size={13} /> Deactivate
                    </button>
                  ) : (
                    <button
                      className={styles.activateBtn}
                      style={{ marginTop: 10, width: '100%' }}
                      onClick={() => handleToggle(oc._id, true)}
                    >
                      <Power size={13} /> Activate
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
