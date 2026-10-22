'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────
   AnimationProvider
   ─ Runs once in layout.tsx (client component)
   ─ Sets up a single IntersectionObserver for the whole site
   ─ Observes: .sr  .sr-l  .sr-r  .sr-scale  .img-rev
   ─ Adds .in when element enters viewport
   ─ Re-scans after route changes
   ─ Also handles: page transition, magnetic CTAs, count-up
──────────────────────────────────────────────────────────────── */

const REVEAL_SELECTORS = '.sr, .sr-l, .sr-r, .sr-scale, .img-rev';

export default function AnimationProvider() {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* ── page transition ─────────────────────────────────────── */
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    main.classList.remove('page-enter');
    // force reflow
    void (main as HTMLElement).offsetHeight;
    main.classList.add('page-enter');
  }, [pathname]);

  /* ── magnetic CTA ────────────────────────────────────────── */
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.mag');
    const cleanups: (() => void)[] = [];

    elements.forEach(el => {
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.transform = `translate(${dx}px,${dy}px)`;
      };
      const onLeave = () => { el.style.transform = 'translate(0,0)'; };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, [pathname]);

  /* ── count-up ─────────────────────────────────────────────── */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-count]');
    if (!els.length) return;
    const duration = 1800;

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = Number(el.dataset.count ?? 0);
        const start = performance.now();
        const tick = (now: number) => {
          const pct = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - pct, 3);
          el.textContent = Math.round(ease * target).toLocaleString();
          if (pct < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });

    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  /* ── scroll reveal ───────────────────────────────────────── */
  const setupObserver = useCallback(() => {
    // Disconnect old observer
    if (observerRef.current) observerRef.current.disconnect();

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(REVEAL_SELECTORS).forEach(el => io.observe(el));
    observerRef.current = io;
  }, []);

  useEffect(() => {
    // Small delay lets new page DOM settle after navigation
    const t = setTimeout(setupObserver, 80);
    return () => clearTimeout(t);
  }, [pathname, setupObserver]);

  /* ── navbar underline reveal ─────────────────────────────── */
  useEffect(() => {
    document.querySelectorAll('.nav-ul').forEach(el => {
      if (el.getAttribute('href') === pathname) el.classList.add('active');
      else el.classList.remove('active');
    });
  }, [pathname]);

  return null; // no DOM output
}
