'use client';
import { useEffect } from 'react';

/**
 * usePageAnimations — Drop into any client page component.
 * Auto-applies global animation classes to standard HTML elements
 * within the given container (defaults to <main>).
 *
 * Targets:
 *  - h1, h2, h3 inside <main>      → .sr (staggered fade-up)
 *  - p.hero*, section > p          → .sr
 *  - article, .card*, [class*=card] → .sr + .lift
 *  - img                            → .img-rev
 *  - section[class*=hero] h1       → .tl-1 text stagger
 *  - a[class*=btn], button[class*=cta] → .mag
 *  - [class*=stats],[class*=count],[data-stat] → .sr + .sd-N
 */
export function usePageAnimations(containerSelector = 'main') {
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Headings fade up
    container.querySelectorAll('h1, h2, h3').forEach((el, i) => {
      if (!el.classList.contains('sr') && !el.classList.contains('tl-1')) {
        el.classList.add('sr');
        if (i > 0) el.classList.add(`sd-${Math.min((i % 4) + 1, 6)}`);
      }
    });

    // Paragraphs in sections
    container.querySelectorAll('section p, header p, .hero p').forEach((el, i) => {
      if (!el.classList.contains('sr')) {
        el.classList.add('sr');
        el.classList.add(`sd-${Math.min((i % 3) + 2, 6)}`);
      }
    });

    // Cards — lift + fade
    container.querySelectorAll(
      'article, [class*="card"], [class*="Card"], [class*="tile"], [class*="Tile"], [class*="step"], [class*="Step"]'
    ).forEach((el, i) => {
      if (!el.classList.contains('sr')) el.classList.add('sr');
      if (!el.classList.contains('lift')) el.classList.add('lift');
      el.classList.add(`sd-${Math.min((i % 6) + 1, 6)}`);
    });

    // Images — clip reveal
    container.querySelectorAll('img:not([class*="logo"]):not([class*="Logo"]):not([class*="icon"]):not([class*="Icon"])').forEach(el => {
      if (!el.classList.contains('img-rev')) {
        el.classList.add('img-rev');
      }
    });

    // CTA buttons — magnetic
    container.querySelectorAll(
      '[class*="btn"],[class*="Btn"],[class*="cta"],[class*="Cta"],[class*="signUp"],[class*="signup"],[class*="apply"]'
    ).forEach(el => {
      if (!el.classList.contains('mag')) el.classList.add('mag');
    });

    // Stat numbers — count-up if they contain only numbers
    container.querySelectorAll('[class*="stat"],[class*="Stat"],[class*="count"],[class*="Count"],[class*="number"],[class*="Number"]').forEach(el => {
      const text = el.textContent?.trim() ?? '';
      const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num > 0 && text.length <= 8) {
        if (!el.getAttribute('data-count')) {
          el.setAttribute('data-count', String(num));
          el.classList.add('count-up');
        }
      }
      if (!el.classList.contains('sr')) el.classList.add('sr');
    });

    // Left-right alternating for feature rows
    container.querySelectorAll(
      '[class*="feature"],[class*="Feature"],[class*="grid"],[class*="Grid"],[class*="row"],[class*="Row"]'
    ).forEach((el, i) => {
      if (!el.classList.contains('sr') && !el.classList.contains('sr-l') && !el.classList.contains('sr-r')) {
        el.classList.add(i % 2 === 0 ? 'sr-l' : 'sr-r');
      }
    });

    // Trigger the observer (AnimationProvider already runs it; just re-trigger)
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.07 });

    container.querySelectorAll('.sr, .sr-l, .sr-r, .sr-scale, .img-rev').forEach(el => io.observe(el));

    return () => io.disconnect();
  }, [containerSelector]);
}
