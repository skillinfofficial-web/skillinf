'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ImageSlider.module.css';

interface ImageSliderProps {
  images: string[];
  name: string;
}

export default function ImageSlider({ images, name }: ImageSliderProps) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className={styles.placeholder}>{name.charAt(0)}</div>;
  }

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <div className={styles.slider}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt={`${name} — image ${index + 1}`} className={styles.image} />

      {images.length > 1 && (
        <>
          <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous image">
            <ChevronLeft size={20} />
          </button>
          <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next image">
            <ChevronRight size={20} />
          </button>
          <div className={styles.counter}>{index + 1} / {images.length}</div>
          <div className={styles.dots}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
