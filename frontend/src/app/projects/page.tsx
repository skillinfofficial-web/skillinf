'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import styles from './ProjectsPage.module.css';

interface Project {
  _id: string;
  name: string;
  domain: string;
  image: string;
  githubLink: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeDomain, setActiveDomain] = useState('All');

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProjects(d.items);
        else setError(d.message ?? 'Failed to load projects.');
      })
      .catch(() => setError('Network error — check your connection.'))
      .finally(() => setLoading(false));
  }, []);

  const domains = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.domain))).sort();
    return ['All', ...unique];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchDomain = activeDomain === 'All' || p.domain === activeDomain;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.domain.toLowerCase().includes(search.toLowerCase());
      return matchDomain && matchSearch;
    });
  }, [projects, activeDomain, search]);

  return (
    <>
      <Navbar />
      <main className={styles.main}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroBadge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.heroBadgeIcon}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C7.463 21.41 6.674 21.04 6.674 21.04c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Student Projects
            </div>
            <h1 className={styles.heroTitle}>Explore Intern Projects</h1>
            <p className={styles.heroSub}>
              Real-world projects built by skillinf interns — browse by domain or search by name.
            </p>

            {/* Search */}
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="projects-search"
                type="search"
                className={styles.searchInput}
                placeholder="Search projects or domains…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="container">

          {/* ── Filter Bar ── */}
          {!loading && domains.length > 1 && (
            <div className={styles.filterSection}>
              <div className={styles.filterLabel}>Filter by Domain</div>
              <div className={styles.filterScroll} role="group" aria-label="Filter by domain">
                {domains.map((d) => {
                  const count = d === 'All' ? projects.length : projects.filter((p) => p.domain === d).length;
                  const isActive = activeDomain === d;
                  return (
                    <button
                      key={d}
                      id={`filter-${d.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ''}`}
                      onClick={() => setActiveDomain(d)}
                    >
                      <span className={styles.chipLabel}>{d}</span>
                      <span className={`${styles.chipCount} ${isActive ? styles.chipCountActive : ''}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Results bar ── */}
          {!loading && (
            <div className={styles.resultsBar}>
              <h2 className={styles.resultsTitle}>
                {activeDomain === 'All' ? 'All Projects' : activeDomain}
              </h2>
              <span className={styles.resultsCount}>
                {filtered.length} project{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className={styles.state}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>Loading projects…</p>
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
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <p className={styles.emptyMsg}>No projects found.</p>
              {(search || activeDomain !== 'All') && (
                <button className={styles.clearBtn} onClick={() => { setSearch(''); setActiveDomain('All'); }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* ── Grid ── */}
          {!loading && !error && filtered.length > 0 && (
            <div className={styles.cardGrid}>
              {filtered.map((proj) => (
                <article key={proj._id} className={styles.card}>
                  {/* Image + hover overlay */}
                  <div className={styles.cardImgWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proj.image} alt={proj.name} className={styles.cardImg} />

                    {/* Domain badge */}
                    <span className={styles.domainBadge}>{proj.domain}</span>

                    {/* Hover overlay — View Project */}
                    <a
                      href={proj.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.viewOverlay}
                      id={`view-project-${proj._id}`}
                      aria-label={`View ${proj.name} on GitHub`}
                    >
                      <span className={styles.viewOverlayBtn}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.ghIcon}>
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        View Project
                      </span>
                    </a>
                  </div>

                  {/* Card body — name only */}
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardName}>{proj.name}</h3>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className={styles.bottomSpacer} />
        </div>
      </main>
      <Footer />
    </>
  );
}
