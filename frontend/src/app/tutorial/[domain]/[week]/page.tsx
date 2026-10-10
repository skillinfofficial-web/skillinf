'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) return u.searchParams.get('v');
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split(/[?&]/)[0];
    if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
  } catch {
    const m = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

function buildEmbedSrc(week: WeekData): string | null {
  if (week.embedUrl?.trim()) {
    const srcMatch = week.embedUrl.match(/src=["']([^"']+)["']/);
    if (srcMatch) return srcMatch[1];
    if (week.embedUrl.includes('youtube.com/embed/')) return week.embedUrl.trim();
    const vid = extractVideoId(week.embedUrl);
    if (vid) return `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`;
  }
  if (week.tutorialUrl?.trim()) {
    const vid = extractVideoId(week.tutorialUrl);
    if (vid) return `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`;
  }
  return null;
}

export default function TutorialPage() {
  const params  = useParams();
  const router  = useRouter();
  const domain  = decodeURIComponent(params.domain as string);
  const weekNum = parseInt(params.week as string, 10);

  const [week,     setWeek]     = useState<WeekData | null>(null);
  const [allWeeks, setAllWeeks] = useState<WeekData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!domain || isNaN(weekNum)) { setError('Invalid tutorial link.'); setLoading(false); return; }
    fetch(`/api/course?domain=${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setError(d.message || 'Course not found.'); return; }
        const weeks = (d.weeks as WeekData[]) ?? [];
        setAllWeeks(weeks);
        const found = weeks.find(w => w.week === weekNum);
        if (!found) { setError(`Week ${weekNum} not found for this course.`); return; }
        setWeek(found);
      })
      .catch(() => setError('Failed to load tutorial. Please try again.'))
      .finally(() => setLoading(false));
  }, [domain, weekNum]);

  const embedSrc = week ? buildEmbedSrc(week) : null;
  const icons = ['🎯', '⚡', '🔧', '💡', '🚀', '✅'];

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p className={styles.centerText}>Loading tutorial...</p>
        </div>
      </div>
    );
  }

  if (error || !week) {
    return (
      <div className={styles.shell}>
        <div className={styles.centerBox}>
          <div className={styles.errIcon}>⚠️</div>
          <h2 className={styles.errTitle}>Tutorial not available</h2>
          <p className={styles.errMsg}>{error || 'Week not found.'}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>← Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>

      <header className={styles.topbar}>
        <button onClick={() => router.back()} className={styles.topBackBtn}>← Back</button>
        <div className={styles.topMeta}>
          <span className={styles.topDomain}>{domain}</span>
          <span className={styles.topSep}>·</span>
          <span className={styles.topWeekLabel}>Week {weekNum}</span>
        </div>
        <Link href="/dashboard" className={styles.topDashLink}>🏠 Dashboard</Link>
      </header>

      <main className={styles.body}>

        {allWeeks.length > 1 && (
          <nav className={styles.weekNav}>
            {allWeeks.map(w => (
              <Link
                key={w.week}
                href={`/tutorial/${encodeURIComponent(domain)}/${w.week}`}
                className={`${styles.weekPill} ${w.week === weekNum ? styles.weekPillActive : ''}`}
              >
                Week {w.week}
              </Link>
            ))}
          </nav>
        )}

        <section className={styles.hero}>
          <div className={styles.heroBadgeRow}>
            <span className={styles.heroChip}>📹 Tutorial</span>
            {week.deadlineDays && (
              <span className={styles.heroChip2}>⏱ {week.deadlineDays}d to complete</span>
            )}
          </div>
          <h1 className={styles.heroTitle}>Week {weekNum} — Task Tutorial</h1>
          {week.whatYouLearn && <p className={styles.heroDesc}>{week.whatYouLearn}</p>}
        </section>

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
              <div className={styles.videoFooter}>
                <span className={styles.videoFooterLabel}>▶ Watch this tutorial to complete Week {weekNum}</span>
                {week.tutorialUrl?.trim() && (
                  <a href={week.tutorialUrl} target="_blank" rel="noreferrer" className={styles.openYt}>
                    Open in YouTube ↗
                  </a>
                )}
              </div>
            </div>
          ) : week.tutorialUrl?.trim() ? (
            <div className={styles.videoFallback}>
              <div className={styles.vfIcon}>▶</div>
              <h3 className={styles.vfTitle}>Watch Tutorial on YouTube</h3>
              <p className={styles.vfDesc}>Click below to open the tutorial</p>
              <a href={week.tutorialUrl} target="_blank" rel="noreferrer" className={styles.vfBtn}>
                Open on YouTube ↗
              </a>
            </div>
          ) : (
            <div className={styles.videoFallback}>
              <div className={styles.vfIcon}>🎓</div>
              <h3 className={styles.vfTitle}>Tutorial coming soon</h3>
              <p className={styles.vfDesc}>This week&apos;s tutorial has not been uploaded yet. Check back soon!</p>
            </div>
          )}
        </section>

        {week.keyFeatures?.filter(Boolean).length > 0 && (
          <section className={styles.featSection}>
            <div className={styles.featHeader}>
              <span className={styles.featEyebrow}>✨ Key Features</span>
              <h2 className={styles.featTitle}>What you&apos;ll cover this week</h2>
              <p className={styles.featSub}>Complete all tasks listed below to finish Week {weekNum}.</p>
            </div>
            <div className={styles.featGrid}>
              {week.keyFeatures.filter(Boolean).map((f, i) => (
                <div key={i} className={styles.featCard}>
                  <span className={styles.featCardIcon}>{icons[i % icons.length]}</span>
                  <p className={styles.featCardText}>{f}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(week.projectTitle || week.projectDescription) && (
          <section className={styles.projectSection}>
            <div className={styles.projectCard}>
              <span className={styles.projectChip}>📌 Project Task</span>
              {week.projectTitle && <h2 className={styles.projectTitle}>{week.projectTitle}</h2>}
              {week.projectDescription && <p className={styles.projectDesc}>{week.projectDescription}</p>}
              <button onClick={() => router.back()} className={styles.projectBtn}>← Back to Dashboard to Submit</button>
            </div>
          </section>
        )}

        <div className={styles.bottomNav}>
          {weekNum > 1 && (
            <Link href={`/tutorial/${encodeURIComponent(domain)}/${weekNum - 1}`} className={styles.navPrev}>
              ← Week {weekNum - 1}
            </Link>
          )}
          <button onClick={() => router.back()} className={styles.navDash}>🏠 Dashboard</button>
          {weekNum < allWeeks.length && (
            <Link href={`/tutorial/${encodeURIComponent(domain)}/${weekNum + 1}`} className={styles.navNext}>
              Week {weekNum + 1} →
            </Link>
          )}
        </div>

      </main>
    </div>
  );
}