'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Settings, Power, AlertTriangle, Loader2,
  CheckCircle, AlertCircle, Globe, ShieldOff,
} from 'lucide-react';
import styles from './settings.module.css';

interface SiteSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const DEFAULT_MSG =
  "We are currently performing scheduled maintenance. We'll be back shortly!\n\nFor urgent queries, contact us at support@skillinf.in";

export default function AdminSettingsPage() {
  const [settings,     setSettings]     = useState<SiteSettings>({ maintenanceMode: false, maintenanceMessage: DEFAULT_MSG });
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toggling,     setToggling]     = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<{ ok: boolean; text: string } | null>(null);
  const [toggleMsg,    setToggleMsg]    = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/site-settings');
      const d = await r.json();
      if (d.success) setSettings(d.settings);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Toggle maintenance mode ── */
  const handleToggle = async () => {
    const next = !settings.maintenanceMode;
    setToggling(true); setToggleMsg(null);
    try {
      const r = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, maintenanceMode: next }),
      });
      const d = await r.json();
      if (d.success) {
        setSettings(s => ({ ...s, maintenanceMode: next }));
        setToggleMsg({
          ok: true,
          text: next
            ? '⚠️ Site is now OFFLINE — visitors will see the maintenance page.'
            : '✅ Site is now ONLINE — all pages are live.',
        });
      } else {
        setToggleMsg({ ok: false, text: d.message || 'Failed to update.' });
      }
    } catch {
      setToggleMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setToggling(false);
      setTimeout(() => setToggleMsg(null), 5000);
    }
  };

  /* ── Save message only ── */
  const handleSaveMessage = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      const r = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const d = await r.json();
      setSaveMsg({ ok: d.success, text: d.success ? 'Message saved successfully.' : (d.message || 'Failed.') });
    } catch {
      setSaveMsg({ ok: false, text: 'Network error.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const isOnline = !settings.maintenanceMode;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}><Settings size={22} /> System Settings</h1>
          <p className={styles.desc}>Control site-wide behaviour and maintenance mode.</p>
        </div>
      </header>

      {loading ? (
        <div className={styles.loadBox}>
          <Loader2 size={28} className={styles.spin} />
          <span>Loading settings…</span>
        </div>
      ) : (
        <>
          {/* ── Site Status Card ── */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.statusDot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
              <h2 className={styles.cardTitle}>Site Status</h2>
              <span className={`${styles.statusBadge} ${isOnline ? styles.badgeOnline : styles.badgeOffline}`}>
                {isOnline ? 'LIVE' : 'MAINTENANCE'}
              </span>
            </div>

            <div className={styles.statusRow}>
              <div className={styles.statusLeft}>
                <div className={`${styles.statusIcon} ${isOnline ? styles.iconOnline : styles.iconOffline}`}>
                  {isOnline ? <Globe size={28} /> : <ShieldOff size={28} />}
                </div>
                <div>
                  <p className={styles.statusTitle}>
                    {isOnline ? 'Website is Online' : 'Maintenance Mode Active'}
                  </p>
                  <p className={styles.statusHint}>
                    {isOnline
                      ? 'All pages are accessible to visitors. Toggle OFF to enable maintenance mode.'
                      : 'Visitors are redirected to the maintenance page. Toggle ON to bring the site back.'}
                  </p>
                </div>
              </div>

              {/* Big toggle */}
              <button
                id="site-status-toggle"
                className={`${styles.bigToggle} ${isOnline ? styles.bigToggleOn : styles.bigToggleOff}`}
                onClick={handleToggle}
                disabled={toggling}
                title={isOnline ? 'Turn OFF — enable maintenance' : 'Turn ON — disable maintenance'}
              >
                <span className={`${styles.bigToggleKnob} ${isOnline ? styles.knobOn : styles.knobOff}`}>
                  {toggling
                    ? <Loader2 size={18} className={styles.spin} />
                    : isOnline ? <Power size={18} /> : <ShieldOff size={18} />}
                </span>
                <span className={styles.bigToggleLabel}>
                  {toggling ? 'Updating…' : isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </button>
            </div>

            {/* Toggle feedback */}
            {toggleMsg && (
              <div className={`${styles.feedbackBar} ${toggleMsg.ok ? styles.feedbackOk : styles.feedbackErr}`}>
                {toggleMsg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {toggleMsg.text}
              </div>
            )}

            {/* Status info pills */}
            <div className={styles.infoPills}>
              <div className={`${styles.pill} ${isOnline ? styles.pillGreen : styles.pillRed}`}>
                {isOnline ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                {isOnline ? 'Public site live' : 'Public site hidden'}
              </div>
              <div className={styles.pill}>
                <Power size={13} />
                Admin panel always accessible
              </div>
              <div className={styles.pill}>
                <Settings size={13} />
                Changes apply within 30 seconds
              </div>
            </div>
          </section>

          {/* ── Maintenance Message Card ── */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <AlertTriangle size={18} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Maintenance Page Message</h2>
            </div>
            <p className={styles.cardDesc}>
              This message appears on the maintenance page when the site is offline.
              Include the support email so visitors can reach you.
            </p>
            <textarea
              id="maintenance-message-input"
              className={styles.msgTextarea}
              rows={6}
              value={settings.maintenanceMessage}
              onChange={e => setSettings(s => ({ ...s, maintenanceMessage: e.target.value }))}
              placeholder="Type the message visitors will see…"
            />

            <div className={styles.msgHint}>
              <AlertCircle size={13} />
              Any email address in the message will auto-appear as a &ldquo;Contact Support&rdquo; button on the maintenance page.
            </div>

            <div className={styles.msgActions}>
              <button
                id="save-message-btn"
                className={styles.saveBtn}
                onClick={handleSaveMessage}
                disabled={saving}
              >
                {saving
                  ? <><Loader2 size={14} className={styles.spin} /> Saving…</>
                  : <><CheckCircle size={14} /> Save Message</>}
              </button>
              {saveMsg && (
                <span className={`${styles.saveFeedback} ${saveMsg.ok ? styles.feedbackOkText : styles.feedbackErrText}`}>
                  {saveMsg.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {saveMsg.text}
                </span>
              )}
            </div>
          </section>

          {/* ── How it works ── */}
          <section className={styles.howCard}>
            <h3 className={styles.howTitle}>How Maintenance Mode Works</h3>
            <div className={styles.howGrid}>
              <div className={styles.howStep}>
                <span className={styles.howNum}>1</span>
                <div>
                  <p className={styles.howLabel}>Toggle OFF</p>
                  <p className={styles.howText}>Click the toggle to put the site into maintenance mode.</p>
                </div>
              </div>
              <div className={styles.howStep}>
                <span className={styles.howNum}>2</span>
                <div>
                  <p className={styles.howLabel}>Visitors Redirected</p>
                  <p className={styles.howText}>All public pages redirect to the maintenance page within 30 seconds.</p>
                </div>
              </div>
              <div className={styles.howStep}>
                <span className={styles.howNum}>3</span>
                <div>
                  <p className={styles.howLabel}>Admin Stays Accessible</p>
                  <p className={styles.howText}>The admin panel at <code>/admin</code> always stays fully accessible.</p>
                </div>
              </div>
              <div className={styles.howStep}>
                <span className={styles.howNum}>4</span>
                <div>
                  <p className={styles.howLabel}>Toggle ON to Go Live</p>
                  <p className={styles.howText}>Flip the toggle back ON to restore the public site instantly.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
