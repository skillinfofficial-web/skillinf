'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import CatalogCard, { CatalogItem } from '@/components/catalog/CatalogCard';
import TrendingCarousel from '@/components/catalog/TrendingCarousel';
import styles from './ProjectsPage.module.css';

const TYPE = 'project';

export default function ProjectsPage() {
  const [all, setAll] = useState<CatalogItem[]>([]);
  const [trending, setTrending] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/catalog/${TYPE}`).then((r) => r.json()),
      fetch(`/api/catalog/${TYPE}?trending=true`).then((r) => r.json()),
    ]).then(([allData, trendData]) => {
      if (allData.success) setAll(allData.items);
      else setError(allData.message ?? 'Failed to load projects.');
      if (trendData.success) setTrending(trendData.items);
    }).catch(() => setError('Network error — check your connection.')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    all.filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase())),
    [all, search]
  );

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className="container">
            <h1 className={styles.heroTitle}>Projects</h1>
            <p className={styles.heroSub}>Explore practical projects built around real-world problems and technologies.</p>
            <div className={styles.searchWrap}>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="container">
          {trending.length > 0 && <TrendingCarousel items={trending} type={TYPE} title="Trending Projects" />}

          <div className={styles.allSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>All Projects</h2>
              <span className={styles.count}>{filtered.length} projects</span>
            </div>

            {loading && <div className={styles.state}><div className={styles.spinner} /><p>Loading projects…</p></div>}
            {!loading && filtered.length === 0 && (
              <div className={styles.state}>
                <p className={styles.emptyMsg}>No projects found.</p>
                {search && <button className={styles.clearBtn} onClick={() => setSearch('')}>Clear Search</button>}
              </div>
            )}
            <div className={styles.cardGrid}>
              {filtered.map((item) => <CatalogCard key={item._id} item={item} type={TYPE} />)}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
