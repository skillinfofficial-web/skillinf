'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import CatalogCard, { CatalogItem } from '@/components/catalog/CatalogCard';
import TrendingCarousel from '@/components/catalog/TrendingCarousel';
import FilterSidebar, { Filters, defaultFilters } from '@/components/catalog/FilterSidebar';
import styles from './ProgramsPage.module.css';

const TYPE = 'program';

export default function ProgramsPage() {
  const [all, setAll] = useState<CatalogItem[]>([]);
  const [trending, setTrending] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  useEffect(() => {
    Promise.all([
      fetch(`/api/catalog/${TYPE}`).then((r) => r.json()),
      fetch(`/api/catalog/${TYPE}?trending=true`).then((r) => r.json()),
    ]).then(([allData, trendData]) => {
      if (allData.success) setAll(allData.items);
      else setError(allData.message ?? 'Failed to load programs.');
      if (trendData.success) setTrending(trendData.items);
    }).catch(() => setError('Network error — check your connection.')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return all.filter((item) => {
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.durationMax > 0 && item.duration && item.duration > filters.durationMax) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = (item as any).pricing;
      if (filters.price && p?.type !== filters.price) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (filters.mentorship && (item as any).mentorship !== filters.mentorship) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (filters.teaching && (item as any).teachingSection !== filters.teaching) return false;
      return true;
    });
  }, [all, filters]);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className="container">
            <h1 className={styles.heroTitle}>Programs</h1>
            <p className={styles.heroSub}>Learn practical skills through structured, project-focused programs designed for real-world impact.</p>
          </div>
        </section>

        <div className="container">
          {!loading && trending.length > 0 && (
            <TrendingCarousel items={trending} type={TYPE} title="Trending Programs" />
          )}

          {error && <div className={styles.errorBanner}>⚠ {error}</div>}

          <div className={styles.contentArea}>
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              type={TYPE}
              totalCount={all.length}
              filteredCount={filtered.length}
            />
            <div className={styles.grid}>
              <div className={styles.gridHeader}>
                <h2 className={styles.gridTitle}>All Programs</h2>
                <div className={styles.gridMeta}>
                  <span className={styles.count}>{filtered.length} of {all.length}</span>
                </div>
              </div>

              {loading && <div className={styles.state}><div className={styles.spinner} /><p>Loading programs…</p></div>}
              {!loading && filtered.length === 0 && !error && (
                <div className={styles.state}>
                  <p className={styles.emptyMsg}>
                    {all.length === 0 ? 'No programs available yet.' : 'No programs match your filters.'}
                  </p>
                  {all.length > 0 && (
                    <button className={styles.clearBtn} onClick={() => setFilters(defaultFilters)}>Clear Filters</button>
                  )}
                </div>
              )}
              <div className={styles.cardGrid}>
                {filtered.map((item) => <CatalogCard key={item._id} item={item} type={TYPE} />)}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
