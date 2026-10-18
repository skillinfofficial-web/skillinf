'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './Guidance.module.css';

interface WeekData {
  week: number;
  deadlineDays: number;
  projectTitle?: string;
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
          <h2 className={styles.errTitle}>Guidance not available</h2>
          <p className={styles.errMsg}>{error || 'Week not found.'}</p>
          <button onClick={() => router.back()} className={styles.dashBtn}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const guidance   = week.projectGuidance?.trim() ?? '';
  const paragraphs = guidance ? guidance.split(/\n+/).filter(Boolean) : [];

  return (
    <div className={styles.shell}>

      {/* Top bar — same as tutorial page */}
      <header className={styles.topbar}>
        <button onClick={() => router.back()} className={styles.topBack}>Back</button>
        <span className={styles.topTitle}>{domain} — Week {weekNum} · Project Guidance</span>
        <button onClick={() => router.push('/dashboard')} className={styles.topDash}>Dashboard</button>
      </header>

      <main className={styles.body}>

        {/* Section heading */}
        <h1 className={styles.pageHeading}>Project Guidance</h1>
        {week.projectTitle?.trim() && (
          <p className={styles.projectTitle}>{week.projectTitle}</p>
        )}

        {/* Content card — copy disabled */}
        <div
          className={styles.contentCard}
          onCopy={e => e.preventDefault()}
          onContextMenu={e => e.preventDefault()}
        >
          {paragraphs.length > 0 ? (
            <div className={styles.guidanceText}>
              {paragraphs.map((para, i) => {
                const isStep = /^(\d+[.):]|Step\s+\d+[:.)])/i.test(para.trim());
                return (
                  <div key={i} className={isStep ? styles.stepPara : styles.normalPara}>
                    <p>{para.trim()}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>No guidance content has been added for this week yet.</p>
          )}
        </div>

      </main>
    </div>
  );
}
