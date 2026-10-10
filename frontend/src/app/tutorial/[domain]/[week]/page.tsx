'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './Tutorial.module.css';

interface WeekData {
  week: number;
  deadlineDays: number;
  tutorialUrl: string;
  embedUrl?: string;
  keyFeatures: string[];
  whatYouLearn: string;
  projectTitle?: string;
  projectDescription?: string;
}

function buildEmbedSrc(week: WeekData): string | null {
  // Try embedUrl first — it may be a raw <iframe> HTML string or a direct URL
  const raw = week.embedUrl?.trim();
  if (raw) {
    // Extract src from iframe HTML: src="..." or src='...'
    const m = raw.match(/src=["']([^"']+)["']/);
    if (m?.[1]) return m[1];
    // Already a bare embed URL
    if (raw.startsWith('http')) {
      // Convert watch URL -> embed URL if needed
      const vidMatch = raw.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (vidMatch) return `https://www.youtube.com/embed/${vidMatch[1]}`;
      if (raw.includes('youtube.com/embed/')) return raw;
    }
  }
  // Fallback to tutorialUrl
  const tu = week.tutorialUrl?.trim();
  if (tu) {
    const vidMatch = tu.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (vidMatch) return `https://www.youtube.com/embed/${vidMatch[1]}`;
    if (tu.includes('youtube.com/embed/')) return tu;
  }
  return null;
}

function getYouTubeWatchUrl(week: WeekData): string {
  return week.tutorialUrl?.trim() || week.embedUrl?.trim() || '';
}

export default function TutorialPage() {
  const params  = useParams();
  const router  = useRouter();
  const domain  = decodeURIComponent(params.domain as string);
  const weekNum = parseInt(params.week as string, 10);

  const [week,    setWeek]    = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!domain || isNaN(weekNum)) { setError('Invalid tutorial link.'); setLoading(false); return; }
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

  const embedSrc   = week ? buildEmbedSrc(week) : null;
  const watchUrl   = week ? getYouTubeWatchUrl(week) : '';
  const keyFeats   = week?.keyFeatures?.filter(Boolean) ?? [];

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p className={styles.centerTxt}>Loading tutorial...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !week) {
    return (
      <div className={styles.shell}>
        <div className={styles.center}>
          <h2 className={styles.errTitle}>Tutorial not available</h2>
          <p className={styles.errMsg}>{error || 'Week not found.'}</p>
          <button onClick={() => router.back()} className={styles.dashBtn}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>

      {/* Top bar */}
      <header className={styles.topbar}>
        <button onClick={() => router.back()} className={styles.topBack}>Back</button>
        <span className={styles.topTitle}>{domain} — Week {weekNum}</span>
        <button onClick={() => router.push('/dashboard')} className={styles.topDash}>Dashboard</button>
      </header>

      <main className={styles.body}>

        {/* Video */}
        <section className={styles.videoSection}>
          {embedSrc ? (
            <div className={styles.videoCard}>
              <div className={styles.videoWrap}>
                <iframe
                  className={styles.videoFrame}
                  src={embedSrc}
                  title={`${domain} Week ${weekNum} Tutorial`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              {watchUrl && (
                <div className={styles.videoFooter}>
                  <span className={styles.videoLabel}>Week {weekNum} Tutorial</span>
                  <a href={watchUrl} target="_blank" rel="noreferrer" className={styles.openYt}>
                    Open in YouTube
                  </a>
                </div>
              )}
            </div>
          ) : watchUrl ? (
            <div className={styles.fallback}>
              <h3 className={styles.fallbackTitle}>Watch Tutorial on YouTube</h3>
              <a href={watchUrl} target="_blank" rel="noreferrer" className={styles.fallbackBtn}>
                Open Tutorial on YouTube
              </a>
            </div>
          ) : (
            <div className={styles.fallback}>
              <h3 className={styles.fallbackTitle}>Tutorial coming soon</h3>
              <p className={styles.fallbackDesc}>This week&apos;s tutorial has not been uploaded yet.</p>
            </div>
          )}
        </section>

        {/* Key Features */}
        {keyFeats.length > 0 && (
          <section className={styles.featSection}>
            <h2 className={styles.featHeading}>Key Features</h2>
            <div className={styles.featGrid}>
              {keyFeats.map((f, i) => (
                <div key={i} className={styles.featCard}>
                  <p className={styles.featText}>{f}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dashboard button */}
        <div className={styles.bottomRow}>
          <button onClick={() => router.push('/dashboard')} className={styles.dashBtn}>
            Back to Dashboard
          </button>
        </div>

      </main>
    </div>
  );
}