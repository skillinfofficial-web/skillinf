'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import styles from './ProgramsPage.module.css';

interface Program {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  platformName: string;
  platformImage: string | null;
  link: string;
}

/* Derive live / completed from dates */
function getStatus(startDate: string, endDate: string): 'live' | 'completed' {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end ? 'live' : 'completed';
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Filters */
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'completed'>('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  useEffect(() => {
    fetch('/api/programs')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPrograms(d.programs);
        else setError(d.message ?? 'Failed to load programs.');
      })
      .catch(() => setError('Network error — check your connection.'))
      .finally(() => setLoading(false));
  }, []);

  /* Unique platform names for dropdown */
  const platformOptions = useMemo(() => {
    const names = Array.from(new Set(programs.map((p) => p.platformName))).sort();
    return names;
  }, [programs]);

  /* Filtered list */
  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const status = getStatus(p.startDate, p.endDate);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (platformFilter !== 'all' && p.platformName !== platformFilter) return false;
      return true;
    });
  }, [programs, statusFilter, platformFilter]);

  const clearFilters = () => { setStatusFilter('all'); setPlatformFilter('all'); };
  const filtersActive = statusFilter !== 'all' || platformFilter !== 'all';

  return (
    <>
      <Navbar />
      <main className={styles.main}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroBadge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.heroBadgeIcon}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Events &amp; Programs
            </div>
            <h1 className={styles.heroTitle}>Explore Programs</h1>
            <p className={styles.heroSub}>
              Discover live events and programs across platforms — hover a card to open the event.
            </p>
          </div>
        </section>

        <div className="container">

          {/* ── Filters ── */}
          {!loading && programs.length > 0 && (
            <div className={styles.filterBar}>
              {/* Status dropdown */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel} htmlFor="filter-status">Status</label>
                <select
                  id="filter-status"
                  className={`${styles.filterSelect} ${statusFilter !== 'all' ? styles.filterSelectActive : ''}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'live' | 'completed')}
                >
                  <option value="all">All Status</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Platform dropdown */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel} htmlFor="filter-platform">Platform</label>
                <select
                  id="filter-platform"
                  className={`${styles.filterSelect} ${platformFilter !== 'all' ? styles.filterSelectActive : ''}`}
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                >
                  <option value="all">All Platforms</option>
                  {platformOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Clear button */}
              {filtersActive && (
                <button className={styles.clearBtn} onClick={clearFilters}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}

              <span className={styles.resultCount}>
                {filtered.length} program{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className={styles.state}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>Loading programs…</p>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className={styles.errorBanner}>{error}</div>
          )}

          {/* ── Empty ── */}
          {!loading && !error && filtered.length === 0 && (
            <div className={styles.state}>
              <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <p className={styles.emptyMsg}>
                {programs.length === 0 ? 'No programs available yet.' : 'No programs match your filters.'}
              </p>
              {filtersActive && (
                <button className={styles.clearBtnLg} onClick={clearFilters}>Clear Filters</button>
              )}
            </div>
          )}

          {/* ── Programs Grid ── */}
          {!loading && !error && filtered.length > 0 && (
            <div className={styles.cardGrid}>
              {filtered.map((prog) => {
                const status = getStatus(prog.startDate, prog.endDate);
                return (
                  <a
                    key={prog._id}
                    href={prog.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.card}
                    id={`program-card-${prog._id}`}
                    aria-label={`Open ${prog.name}`}
                  >
                    {/* Platform image */}
                    <div className={styles.cardImgWrap}>
                      {prog.platformImage
                        ? /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={prog.platformImage} alt={prog.platformName} className={styles.cardImg} />
                        : <div className={styles.cardImgFallback}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                          </div>
                      }

                      {/* Hover overlay */}
                      <div className={styles.viewOverlay}>
                        <span className={styles.viewOverlayBtn}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                            <path d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                          Open Event
                        </span>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className={styles.cardBody}>
                      <p className={styles.cardName}>{prog.name}</p>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardPlatform}>{prog.platformName}</span>
                        <span className={`${styles.statusBadge} ${status === 'live' ? styles.statusLive : styles.statusCompleted}`}>
                          <span className={styles.statusDot} />
                          {status === 'live' ? 'Live' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          <div className={styles.bottomSpacer} />
        </div>
      </main>
      <Footer />
    </>
  );
}
