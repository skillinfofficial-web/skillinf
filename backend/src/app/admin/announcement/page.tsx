'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Save, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import styles from './announcement.module.css';

const DEFAULT_MSG =
  '🎓 Registrations Open — Next Internship Batch Starting Soon · Register Now → · Apply Before Slots End';

export default function AnnouncementPage() {
  const [message,  setMessage]  = useState('');
  const [enabled,  setEnabled]  = useState(true);
  const [original, setOriginal] = useState('');
  const [origEnabled, setOrigEnabled] = useState(true);

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  /* ── Load ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/announcement')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setMessage(d.message);
          setOriginal(d.message);
          setEnabled(d.enabled);
          setOrigEnabled(d.enabled);
        } else {
          setError(d.message || 'Failed to load.');
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Save ───────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    setError(''); setSuccess('');
    if (!message.trim()) { setError('Message cannot be empty.'); return; }
    setSaving(true);
    try {
      const res  = await fetch('/api/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginal(message.trim());
        setOrigEnabled(enabled);
        setSuccess('Announcement bar updated! Changes are live on the home page.');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Failed to save.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMessage(original);
    setEnabled(origEnabled);
    setError('');
    setSuccess('');
  };

  const isDirty = message !== original || enabled !== origEnabled;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Announcement Bar</h1>
          <p className={styles.desc}>
            Edit the scrolling ticker text shown below the navbar on the home page.
          </p>
        </div>
        <div className={`${styles.statusBadge} ${enabled ? styles.badgeOn : styles.badgeOff}`}>
          {enabled ? '● Live' : '○ Hidden'}
        </div>
      </header>

      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={24} className={styles.spin} />
          <span>Loading…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Preview ──────────────────────────────────────────────────── */}
          <div className={styles.previewCard}>
            <p className={styles.previewLabel}>Live Preview</p>
            <div className={`${styles.previewBar} ${!enabled ? styles.previewBarOff : ''}`}>
              <div className={styles.previewTrack}>
                <span className={styles.previewText}>{message || DEFAULT_MSG}</span>
                <span className={styles.previewText} aria-hidden="true">{message || DEFAULT_MSG}</span>
              </div>
              <span className={styles.previewPill}>Register Now</span>
            </div>
            {!enabled && (
              <p className={styles.hiddenNote}>⚠ The bar is currently hidden on the home page.</p>
            )}
          </div>

          {/* ── Settings ─────────────────────────────────────────────────── */}
          <div className={styles.settingsCard}>
            <div className={styles.toggleRow}>
              <div>
                <p className={styles.fieldLabel}>Show Announcement Bar</p>
                <p className={styles.fieldHint}>Toggle whether the scrolling bar is visible on the site.</p>
              </div>
              <label className={styles.toggle} htmlFor="bar-enabled">
                <input
                  id="bar-enabled"
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="announcement-text">
                Ticker Message Text
              </label>
              <p className={styles.fieldHint}>
                This text scrolls continuously across the bar. Use " · " (space-dot-space) as a separator between items.
              </p>
              <textarea
                id="announcement-text"
                className={styles.textarea}
                value={message}
                onChange={(e) => { setMessage(e.target.value); setError(''); }}
                rows={4}
                placeholder={DEFAULT_MSG}
              />
              <div className={styles.charCount}>{message.length} characters</div>
            </div>
          </div>

          {/* ── Feedback ─────────────────────────────────────────────────── */}
          {error   && <div className={styles.errorBox}><AlertCircle size={16} />{error}</div>}
          {success && <div className={styles.successBox}><CheckCircle size={16} />{success}</div>}

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className={styles.actions}>
            <button
              className={styles.resetBtn}
              onClick={handleReset}
              disabled={!isDirty || saving}
              id="reset-announcement-btn"
            >
              <RotateCcw size={15} /> Discard Changes
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!isDirty || saving}
              id="save-announcement-btn"
            >
              {saving
                ? <><Loader2 size={15} className={styles.spin} /> Saving…</>
                : <><Save size={15} /> Save Changes</>
              }
            </button>
          </div>

          {isDirty && !saving && (
            <p className={styles.unsavedNote}>
              <Megaphone size={13} /> You have unsaved changes.
            </p>
          )}
        </>
      )}
    </div>
  );
}
