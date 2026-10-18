'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './Guidance.module.css';

interface WeekData {
  week: number;
  deadlineDays: number;
  tutorialUrl: string;
  embedUrl?: string;
  keyFeatures: string[];
  whatYouLearn: string;
  projectTitle?: string;
  projectDescription?: string;
  projectGuidance?: string;
}

export default function GuidancePage() {
  const params  = useParams();
  const router  = useRouter();
  const domain  = decodeURIComponent(params.domain as string);
  const weekNum = parseInt(params.week as string, 10);

  const [week,    setWeek]    = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!domain || isNaN(weekNum)) { setError('Invalid guidance link.'); setLoading(false); return; }
    fetch(`/api/course?domain=${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setError(d.message || 'Course not found.'); return; }
        const found = (d.weeks as WeekData[])?.find(w => w.week === weekNum);
        if (!found) { setError(`Week ${weekNum} not found.`); return; }
        setWeek(found);
      })
      .catch(() => setError('Failed to load. Please try again.'))
      .finally(() => setLoading(false));
  }, [domain, weekNum]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p className={styles.centerTxt}>Loading project guidance…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !week) {
    return (
      <div className={styles.shell}>
        <div className={styles.center}>
          <span className={styles.errIcon}>📋</span>
          <h2 className={styles.errTitle}>Guidance not available</h2>
          <p className={styles.errMsg}>{error || 'Week not found.'}</p>
          <button onClick={() => router.back()} className={styles.dashBtn}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const guidance = week.projectGuidance?.trim();
  const paragraphs = guidance ? guidance.split(/\n+/).filter(Boolean) : [];

  return (
    <div className={styles.shell}>

      {/* ── Top bar ── */}
      <header className={styles.topbar}>
        <button onClick={() => router.back()} className={styles.topBack}>← Back</button>
        <span className={styles.topTitle}>{domain} — Week {weekNum} · Project Guidance</span>
        <button onClick={() => router.push('/dashboard')} className={styles.topDash}>Dashboard</button>
      </header>

      <main className={styles.body}>

        {/* ── YouTube-frame style content card ── */}
        <div className={styles.frameCard}>

          {/* Frame header bar (mimics YouTube's dark top bar) */}
          <div className={styles.frameHeader}>
            <div className={styles.frameHeaderLeft}>
              <span className={styles.frameDot} style={{ background: '#ef4444' }} />
              <span className={styles.frameDot} style={{ background: '#f59e0b' }} />
              <span className={styles.frameDot} style={{ background: '#22c55e' }} />
            </div>
            <span className={styles.frameHeaderTitle}>📋 Project Guidance</span>
            <span className={styles.frameHeaderRight}>Week {weekNum}</span>
          </div>

          {/* Main content area */}
          <div className={styles.frameBody}>

            {/* Project title */}
            {week.projectTitle?.trim() && (
              <div className={styles.projectTitleBand}>
                <span className={styles.projectTitleIcon}>🚀</span>
                <h1 className={styles.projectTitle}>{week.projectTitle}</h1>
              </div>
            )}

            {/* Guidance content */}
            {paragraphs.length > 0 ? (
              <div className={styles.guidanceContent}>
                <div className={styles.guidanceSectionLabel}>
                  <span className={styles.guidanceSectionIcon}>💡</span>
                  <span>Step-by-Step Guidance</span>
                </div>
                <div className={styles.guidanceText}>
                  {paragraphs.map((para, i) => {
                    // Detect numbered steps like "1." "2." "Step 1:" etc.
                    const isStep = /^(\d+[\.\)]|Step\s+\d+[:.\)])/i.test(para.trim());
                    return (
                      <div key={i} className={isStep ? styles.guidanceStep : styles.guidancePara}>
                        {isStep && <span className={styles.stepMarker} />}
                        <p>{para.trim()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.noGuidance}>
                <span>📭</span>
                <p>No guidance content has been added for this week yet.</p>
              </div>
            )}

          </div>

          {/* Frame footer bar (mimics YouTube bottom controls) */}
          <div className={styles.frameFooter}>
            <span className={styles.frameFooterLeft}>{domain}</span>
            <button onClick={() => router.push(`/tutorial/${encodeURIComponent(domain)}/${weekNum}`)} className={styles.watchTutorialBtn}>
              ▶ Watch Tutorial
            </button>
            <span className={styles.frameFooterRight}>Week {weekNum} of 4</span>
          </div>
        </div>

        {/* ── Meta info pills ── */}
        <div className={styles.metaRow}>
          {week.projectTitle?.trim() && (
            <div className={styles.metaPill}>
              <span className={styles.metaPillIcon}>🗂</span>
              <span>{week.projectTitle}</span>
            </div>
          )}
          <div className={styles.metaPill}>
            <span className={styles.metaPillIcon}>📅</span>
            <span>Deadline: {week.deadlineDays} days</span>
          </div>
        </div>

        {/* ── What you learn ── */}
        {week.whatYouLearn?.trim() && (
          <section className={styles.learnSection}>
            <h2 className={styles.sectionHeading}>What You Learn This Week</h2>
            <p className={styles.learnText}>{week.whatYouLearn}</p>
          </section>
        )}

        {/* ── Project description ── */}
        {week.projectDescription?.trim() && (
          <section className={styles.descSection}>
            <h2 className={styles.sectionHeading}>What You Need to Build</h2>
            <p className={styles.descText}>{week.projectDescription}</p>
          </section>
        )}

      </main>
    </div>
  );
}
