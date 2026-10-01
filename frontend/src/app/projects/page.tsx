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

  /* ── Derived domain list ── */
  const domains = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.domain))).sort();
    return ['All', ...unique];
  }, [projects]);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchDomain = activeDomain === 'All' || p.domain === activeDomain;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.domain.toLowerCase().includes(search.toLowerCase());
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
            <h1 className={styles.heroTitle}>Student Projects</h1>
            <p className={styles.heroSub}>
              Real-world projects built by skillinf interns — browse by domain or search by name.
            </p>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">×</button>
              )}
            </div>
          </div>
        </section>

        <div className="container">

          {/* ── Domain Filter Tabs ── */}
          {!loading && domains.length > 1 && (
            <div className={styles.filterBar} role="group" aria-label="Filter by domain">
              {domains.map((d) => (
                <button
                  key={d}
                  id={`filter-${d.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`${styles.filterChip} ${activeDomain === d ? styles.filterChipActive : ''}`}
                  onClick={() => setActiveDomain(d)}
                >
                  {d}
                  {d !== 'All' && (
                    <span className={styles.chipCount}>
                      {projects.filter((p) => p.domain === d).length}
                    </span>
                  )}
                  {d === 'All' && (
                    <span className={styles.chipCount}>{projects.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Results Header ── */}
          <div className={styles.resultsHeader}>
            <h2 className={styles.sectionTitle}>
              {activeDomain === 'All' ? 'All Projects' : activeDomain}
            </h2>
            <span className={styles.count}>{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className={styles.state}>
              <div className={styles.spinner} />
              <p>Loading projects…</p>
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
                <path d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              <p className={styles.emptyMsg}>No projects found.</p>
              {(search || activeDomain !== 'All') && (
                <button className={styles.clearBtn} onClick={() => { setSearch(''); setActiveDomain('All'); }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* ── Projects Grid ── */}
          {!loading && !error && filtered.length > 0 && (
            <div className={styles.cardGrid}>
              {filtered.map((proj) => (
                <article key={proj._id} className={styles.card}>
                  <div className={styles.cardImgWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proj.image} alt={proj.name} className={styles.cardImg} />
                    <span className={styles.domainBadge}>{proj.domain}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardName}>{proj.name}</h3>
                    <a
                      href={proj.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.viewBtn}
                      id={`view-project-${proj._id}`}
                      aria-label={`View ${proj.name} on GitHub`}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className={styles.githubIcon}>
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      View Project
                      <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </a>
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
