'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import styles from './FilterSidebar.module.css';

export interface Filters {
  search: string;
  durationMax: number;   // 0 = any
  price: '' | 'free' | 'paid';
  mentorship: '' | 'Available' | 'Not Available';
  teaching: string;
}

export const defaultFilters: Filters = {
  search: '',
  durationMax: 0,
  price: '',
  mentorship: '',
  teaching: '',
};

interface FilterSidebarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  type: 'internship' | 'program' | 'project';
  totalCount: number;
  filteredCount: number;
}

const DURATION_MAX = 30;
const teachingOptions = ['Morning', 'Afternoon', 'Evening', 'Night'];

function hasActive(f: Filters): boolean {
  return !!(f.search || f.durationMax > 0 || f.price || f.mentorship || f.teaching);
}

function countActive(f: Filters): number {
  let n = 0;
  if (f.search) n++;
  if (f.durationMax > 0) n++;
  if (f.price) n++;
  if (f.mentorship) n++;
  if (f.teaching) n++;
  return n;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={styles.section}>
      <button className={styles.sectionBtn} onClick={() => setOpen((o) => !o)}>
        <span className={styles.sectionTitle}>{title}</span>
        <ChevronDown size={14} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

function FilterContent({ filters, onChange, type }: { filters: Filters; onChange: (f: Filters) => void; type: string }) {
  const set = (key: keyof Filters, val: unknown) => onChange({ ...filters, [key]: val });
  const isProject = type === 'project';

  return (
    <div className={styles.filterContent}>

      {/* Search */}
      <Section title="Search">
        <input
          type="search"
          className={styles.searchInput}
          placeholder={`Search ${type}s…`}
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </Section>

      {/* Duration — single max slider */}
      {!isProject && (
        <Section title="Max Duration">
          <div className={styles.rangeLabel}>
            {filters.durationMax === 0
              ? <span className={styles.rangeCurrent}>Any duration</span>
              : <span className={styles.rangeCurrent}>Up to <strong>{filters.durationMax} weeks</strong></span>
            }
          </div>
          <input
            type="range"
            min={0}
            max={DURATION_MAX}
            step={1}
            value={filters.durationMax}
            onChange={(e) => set('durationMax', Number(e.target.value))}
            className={styles.rangeInput}
          />
          <div className={styles.rangeEnds}>
            <span>Any</span>
            <span>{DURATION_MAX} wks</span>
          </div>
        </Section>
      )}

      {/* Price */}
      {!isProject && (
        <Section title="Price">
          <div className={styles.pillGroup}>
            {([['', 'All'], ['free', '🆓 Free'], ['paid', '💳 Paid']] as const).map(([val, label]) => (
              <button
                key={val || 'all'}
                className={`${styles.pill} ${filters.price === val ? styles.pillActive : ''}`}
                onClick={() => set('price', val)}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Mentorship */}
      {!isProject && (
        <Section title="Mentorship">
          <div className={styles.pillGroup}>
            {([['', 'All'], ['Available', '✓ Available'], ['Not Available', '✗ None']] as const).map(([val, label]) => (
              <button
                key={val || 'all'}
                className={`${styles.pill} ${filters.mentorship === val ? styles.pillActive : ''}`}
                onClick={() => set('mentorship', val)}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Teaching timing */}
      {!isProject && (
        <Section title="Timing">
          <select
            className={styles.select}
            value={filters.teaching}
            onChange={(e) => set('teaching', e.target.value)}
          >
            <option value="">Any timing</option>
            {teachingOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Section>
      )}
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, type, totalCount, filteredCount }: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = hasActive(filters);
  const activeCount = countActive(filters);
  const clearAll = () => onChange(defaultFilters);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className={styles.desktopSidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}><SlidersHorizontal size={14} /> Filters</span>
          {active && <button className={styles.clearAllBtn} onClick={clearAll}>Clear all</button>}
        </div>
        <FilterContent filters={filters} onChange={onChange} type={type} />
      </aside>

      {/* ── Mobile trigger ───────────────────────────────── */}
      <button className={styles.mobileTrigger} onClick={() => setMobileOpen(true)} id="mobile-filter-btn">
        <SlidersHorizontal size={15} />
        Filters
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        <span className={styles.triggerCount}>{filteredCount}/{totalCount}</span>
      </button>

      {/* ── Overlay + Drawer ─────────────────────────────── */}
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}
      <div className={`${styles.drawer} ${mobileOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}><SlidersHorizontal size={16} /> Filters</span>
          <button className={styles.drawerClose} onClick={() => setMobileOpen(false)} aria-label="Close filters">
            <X size={18} />
          </button>
        </div>
        <div className={styles.drawerBody}>
          <FilterContent filters={filters} onChange={onChange} type={type} />
        </div>
        <div className={styles.drawerFooter}>
          {active && <button className={styles.clearBtn} onClick={clearAll}>Clear All</button>}
          <button className={styles.applyBtn} onClick={() => setMobileOpen(false)}>
            Show {filteredCount} result{filteredCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </>
  );
}
