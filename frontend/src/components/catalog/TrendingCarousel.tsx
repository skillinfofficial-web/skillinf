'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CatalogCard, { CatalogItem } from './CatalogCard';
import styles from './TrendingCarousel.module.css';

interface TrendingCarouselProps {
  items: CatalogItem[];
  type: 'internship' | 'program' | 'project';
  title?: string;
}

export default function TrendingCarousel({
  items,
  type,
  title = 'Trending',
}: TrendingCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [hovered, setHovered] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const CARD_W = 300;
  const GAP = 20;

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -(CARD_W + GAP) : CARD_W + GAP, behavior: 'smooth' });
  };

  // Auto-slide every 4s unless hovered
  useEffect(() => {
    if (items.length <= 1) return;
    autoRef.current = setInterval(() => {
      if (!hovered) {
        const el = trackRef.current;
        if (!el) return;
        const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
        if (atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
        else el.scrollBy({ left: CARD_W + GAP, behavior: 'smooth' });
      }
    }, 4000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [hovered, items.length]);

  if (items.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.flame}>🔥</span> {title}
        </h2>
        <div className={styles.arrows}>
          <button
            className={`${styles.arrow} ${!canLeft ? styles.arrowDisabled : ''}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className={`${styles.arrow} ${!canRight ? styles.arrowDisabled : ''}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        className={styles.track}
        ref={trackRef}
        onScroll={updateArrows}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {items.map((item) => (
          <div key={item._id} className={styles.slide}>
            <CatalogCard item={item} type={type} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
