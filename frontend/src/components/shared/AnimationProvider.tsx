'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────
   AnimationProvider — mounts once in layout.tsx
   Auto-applies animations to ALL pages on every route change:
     1. stampAnimations()  — adds classes (sr, lift, img-rev, mag…)
     2. setupObserver()    — IntersectionObserver fires .in
     3. countUp            — animates [data-count] numbers
     4. magnetic           — CTA buttons follow cursor
     5. pageEnter          — main fades in on navigation
     6. navActive          — underline on active link
──────────────────────────────────────────────────────────────── */

const REVEAL = '.sr,.sr-l,.sr-r,.sr-scale,.img-rev';

/** Stamp animation classes onto raw DOM elements in <main> */
/** Check if element is inside a [data-no-stamp] container */
function isProtected(el: Element): boolean {
  return !!el.closest('[data-no-stamp]');
}

function stampAnimations() {
  const main = document.querySelector('main');
  if (!main) return;

  // h1-h3 → staggered fade-up (skip protected zones)
  main.querySelectorAll('h1,h2,h3').forEach((el, i) => {
    if (isProtected(el)) return;
    if (!el.classList.contains('sr') && !el.classList.contains('tl-1')) {
      el.classList.add('sr');
      if (i > 0) el.classList.add(`sd-${Math.min((i % 4) + 1, 6)}`);
    }
  });

  // section & header paragraphs → fade-up (skip protected zones)
  main.querySelectorAll('section p, header p').forEach((el, i) => {
    if (isProtected(el)) return;
    if (!el.classList.contains('sr')) {
      el.classList.add('sr');
      el.classList.add(`sd-${Math.min((i % 3) + 2, 6)}`);
    }
  });

  // cards / articles / tiles / steps / items → lift + stagger (skip protected zones)
  main.querySelectorAll(
    'article,[class*="card"],[class*="Card"],[class*="tile"],[class*="Tile"],' +
    '[class*="step"],[class*="Step"],[class*="item"],[class*="Item"]'
  ).forEach((el, i) => {
    if (isProtected(el)) return;
    if (!el.classList.contains('sr') && !el.classList.contains('sr-l'))
      el.classList.add('sr');
    if (!el.classList.contains('lift')) el.classList.add('lift');
    el.classList.add(`sd-${Math.min((i % 6) + 1, 6)}`);
  });

  // images → clip-path reveal (skip logos/icons/avatars + protected zones)
  main.querySelectorAll('img').forEach(img => {
    if (isProtected(img)) return;
    const c = img.className ?? '';
    if (/logo|Logo|icon|Icon|avatar|Avatar/.test(c)) return;
    if (!img.classList.contains('img-rev')) img.classList.add('img-rev');
  });

  // CTA buttons → magnetic (skip protected zones)
  main.querySelectorAll(
    '[class*="btn"],[class*="Btn"],[class*="Cta"],[class*="cta"],' +
    '[class*="signUp"],[class*="signup"],[class*="apply"],[class*="Apply"]'
  ).forEach(el => {
    if (isProtected(el)) return;
    if (!el.classList.contains('mag')) el.classList.add('mag');
  });

  // stat/count elements → sr + count-up (skip protected zones)
  main.querySelectorAll('[class*="stat"],[class*="Stat"],[class*="count"],[class*="Count"]').forEach(el => {
    if (isProtected(el)) return;
    if (!el.classList.contains('sr')) el.classList.add('sr');
    const text = (el.textContent ?? '').trim();
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num > 9 && text.length <= 8 && !el.getAttribute('data-count')) {
      el.setAttribute('data-count', String(num));
      el.classList.add('count-up');
    }
  });

  // feature / section blocks → alternate left/right slide-in (skip protected zones)
  main.querySelectorAll('[class*="feature"],[class*="Feature"],[class*="section"]').forEach((el, i) => {
    if (isProtected(el)) return;
    if (!el.classList.contains('sr') && !el.classList.contains('sr-l') && !el.classList.contains('sr-r'))
      el.classList.add(i % 2 === 0 ? 'sr-l' : 'sr-r');
  });
}

export default function AnimationProvider() {
  const pathname = usePathname();
  const ioRef = useRef<IntersectionObserver | null>(null);

  /* 1. Page-enter transition */
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    main.classList.remove('page-enter');
    void (main as HTMLElement).offsetHeight; // force reflow
    main.classList.add('page-enter');
  }, [pathname]);

  /* 2. Magnetic CTA */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.mag');
    const offs: (() => void)[] = [];
    els.forEach(el => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .28}px,${(e.clientY - r.top - r.height / 2) * .28}px)`;
      };
      const leave = () => { el.style.transform = ''; };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      offs.push(() => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); });
    });
    return () => offs.forEach(f => f());
  }, [pathname]);

  /* 3. Count-up */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-count]');
    if (!els.length) return;
    const dur = 1800;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        const target = Number(el.dataset.count ?? 0);
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString();
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  /* 4. Scroll-reveal IntersectionObserver */
  const setupObserver = useCallback(() => {
    ioRef.current?.disconnect();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.07 });
    document.querySelectorAll(REVEAL).forEach(el => io.observe(el));
    ioRef.current = io;
  }, []);

  /* 5. Auto-stamp classes + start observer on every route */
  useEffect(() => {
    const t = setTimeout(() => { stampAnimations(); setupObserver(); }, 120);
    return () => clearTimeout(t);
  }, [pathname, setupObserver]);

  /* 6. Navbar active underline */
  useEffect(() => {
    document.querySelectorAll('.nav-ul').forEach(el => {
      el.classList.toggle('active', el.getAttribute('href') === pathname);
    });
  }, [pathname]);

  return null;
}
