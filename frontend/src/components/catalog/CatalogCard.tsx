'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './CatalogCard.module.css';

interface Pricing {
  type: 'free' | 'paid';
  originalPrice?: number | null;
  offerPercentage?: number;
  finalPrice?: number | null;
}

export interface CatalogItem {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  images?: string[];
  trending?: boolean;
  duration?: number;
  time?: number;
  pricing?: Pricing;
  link?: string;
  skills?: string[];
}

interface CatalogCardProps {
  item: CatalogItem;
  type: 'internship' | 'program' | 'project';
  compact?: boolean;
}

export default function CatalogCard({ item, type, compact }: CatalogCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const images = item.images ?? [];

  // Auto-rotate images slowly
  useEffect(() => {
    if (images.length > 1) {
      timerRef.current = setInterval(() => {
        setImgIndex((i) => (i + 1) % images.length);
      }, 3500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length]);

  const isProject = type === 'project';
  const detailHref = isProject ? (item.link ?? '#') : `/${type}s/${item.slug ?? item._id}`;
  const isExternal = isProject && !!item.link;

  const pricing = item.pricing;
  const isFree = !pricing || pricing.type === 'free';
  const hasDiscount = !isFree && pricing?.offerPercentage && pricing.offerPercentage > 0;

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      {/* Image */}
      <div className={styles.imageWrap}>
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[imgIndex]}
            alt={item.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>{type.charAt(0).toUpperCase()}</span>
          </div>
        )}
        {item.trending && <span className={styles.trendingBadge}>🔥 Trending</span>}
        {images.length > 1 && (
          <div className={styles.dots}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === imgIndex ? styles.dotActive : ''}`}
                onClick={() => setImgIndex(i)}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.name}>{item.name}</h3>

        {/* Meta chips */}
        {!isProject && (
          <div className={styles.meta}>
            {item.duration && <span className={styles.chip}>⏱ {item.duration} Weeks</span>}
            {item.time && <span className={styles.chip}>🕐 {item.time} hrs/week</span>}
          </div>
        )}

        {/* Pricing */}
        {!isProject && (
          <div className={styles.pricing}>
            {isFree ? (
              <span className={styles.freeLabel}>Free</span>
            ) : (
              <>
                {hasDiscount && pricing?.originalPrice != null && (
                  <span className={styles.originalPrice}>₹{pricing.originalPrice.toLocaleString('en-IN')}</span>
                )}
                <span className={styles.finalPrice}>
                  ₹{(pricing?.finalPrice ?? pricing?.originalPrice ?? 0).toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className={styles.discountBadge}>{pricing?.offerPercentage}% OFF</span>
                )}
              </>
            )}
          </div>
        )}

        {/* CTA */}
        <Link
          href={detailHref}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className={styles.cta}
        >
          {isProject ? 'View Project' : `View ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        </Link>
      </div>
    </div>
  );
}
