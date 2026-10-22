'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import s from './NewHomePage.module.css';

/* ── DATA ─────────────────────────────────────────────────────────────── */
const SERVICES = [
  {
    num: '01', img: '/svc-web.jpg', rev: false,
    name: 'Website Development',
    desc: 'We design and develop high-performance websites and web applications that look great, load fast, and convert visitors into customers. From marketing sites to complex SaaS platforms — built production-ready.',
    features: ['Custom React & Next.js Websites', 'Landing Pages & Marketing Sites', 'SaaS Platforms & Web Apps', 'E-Commerce & Storefronts'],
  },
  {
    num: '02', img: '/svc-ai.jpg', rev: true,
    name: 'AI Automation',
    desc: 'Reduce manual work and accelerate operations with custom AI agents and automation pipelines. We build intelligent workflows that handle repetitive tasks so your team can focus on what matters.',
    features: ['Custom AI Agents & Chatbots', 'Business Workflow Automation', 'CRM & Sales Automation', 'Lead Generation Systems'],
  },
  {
    num: '03', img: '/svc-uiux.jpg', rev: false,
    name: 'UI/UX Design',
    desc: 'Design is not just how it looks — it is how it works. We create intuitive, visually refined interfaces for websites, mobile apps, dashboards, and SaaS products that earn user trust.',
    features: ['End-to-End Figma Design', 'Design Systems & Component Libraries', 'Mobile App UI & Dashboards', 'User Research & Prototyping'],
  },
  {
    num: '04', img: '/svc-3d.jpg', rev: true,
    name: '3D Design & Rendering',
    desc: 'Bring ideas to life with photorealistic 3D visuals. We produce architectural renders, product visualizations, construction walkthroughs, and animated brand assets that make a lasting impression.',
    features: ['Architectural 3D Rendering', 'Product Visualization', 'Construction Walkthroughs', 'Brand Animations & Videos'],
  },
];

const INTERN_DOMAINS = [
  { name: 'Web Development',         badge: 'Most Popular'       },
  { name: 'Data Science',            badge: 'High Demand'        },
  { name: 'Artificial Intelligence', badge: 'Trending'           },
  { name: 'Python Development',      badge: 'Beginner Friendly'  },
  { name: 'UI/UX Design',            badge: 'Creative'           },
  { name: 'Data Analytics',          badge: 'Industry Ready'     },
  { name: 'Cloud Computing',         badge: 'Future Skills'      },
  { name: 'Cybersecurity',           badge: 'In Demand'          },
];

const HOW_IT_WORKS = [
  { num:'01', title:'Explore',       desc:'Browse programs and find the domain that aligns with your interests and career goals.',              fill:'16%'  },
  { num:'02', title:'Apply',         desc:'Submit a simple application with your details and what you want to build.',                          fill:'33%'  },
  { num:'03', title:'Learn',         desc:'Follow a structured weekly curriculum and build technical depth in your chosen track.',               fill:'50%'  },
  { num:'04', title:'Build',         desc:'Complete real-world project tasks you can add to your portfolio and resume.',                         fill:'67%'  },
  { num:'05', title:'Get Reviewed',  desc:'Submit your project for expert feedback and guidance to improve your work further.',                  fill:'84%'  },
  { num:'06', title:'Get Certified', desc:'Receive a verified certificate upon program completion to strengthen your professional profile.',     fill:'100%' },
];

const OUTCOMES = [
  { title:'Build Practical Skills',       desc:'Develop hands-on technical skills through structured learning activities that go beyond theory.' },
  { title:'Work on Real Projects',        desc:'Apply knowledge to projects inspired by real-world industry problems and scenarios.' },
  { title:'Create Your Portfolio',        desc:'Build completed projects to showcase on your resume, GitHub, LinkedIn, and portfolio.' },
  { title:'Develop Problem-Solving',      desc:'Learn how to approach technical problems, break them down, and build structured solutions.' },
  { title:'Gain Professional Confidence', desc:'Work through project requirements, peer reviews, and delivery cycles that mirror real jobs.' },
  { title:'Become Career Ready',          desc:'Develop the technical foundation and proven experience needed to take the next step in your career.' },
];

const WHY = [
  { title:'Practical, Not Theoretical',  desc:'Every activity is designed to produce something you can demonstrate — not just understand.' },
  { title:'Structured Learning Journey', desc:'A clear path from day one to completion, with no confusion about what to do next.' },
  { title:'Real-World Project Focus',    desc:'Projects are designed around industry-relevant scenarios, not fabricated classroom exercises.' },
  { title:'Guided Throughout',           desc:'Support and feedback are built into the program so you always know how to improve.' },
  { title:'Portfolio-First Approach',    desc:'Everything you build is intended to be shown to future employers or clients.' },
  { title:'Zero-Barrier Entry',          desc:'No prior experience requirements — just commitment and a willingness to learn and build.' },
];

const MARQUEE_ITEMS = [
  'Website Development', 'AI Automation', 'UI/UX Design', '3D Rendering',
  'React & Next.js', 'Figma Design Systems', 'AI Agents', 'Architectural 3D',
  'SaaS Platforms', 'Workflow Automation', 'Product Rendering', 'E-Commerce',
];

const STATS = [
  { target: 4,    suffix: '',  label: 'Core Digital Services'  },
  { target: 1040, suffix: '+', label: 'Active Interns'         },
  { target: 80,   suffix: '+', label: 'Certificates Issued'    },
  { target: 9,    suffix: '+', label: 'Internship Domains'     },
  { target: 4,    suffix: '',  label: 'Weeks Per Program'      },
];

/* ── HOOKS ──────────────────────────────────────────────────────────── */

function useScrollReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.unobserve(el); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const pct = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - pct, 3);
          setVal(Math.round(ease * target));
          if (pct < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { ref, val };
}

function useMagnetic(strength = 0.3) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * strength;
    const dy = (e.clientY - (r.top  + r.height / 2)) * strength;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, [strength]);
  const onMouseLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)';
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

function useParallax(factor = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => {
      if (ref.current) ref.current.style.transform = `translateY(${window.scrollY * factor}px)`;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [factor]);
  return ref;
}

/* ── SUB-COMPONENTS ─────────────────────────────────────────────────── */

function SR({ children, cls }: { children: React.ReactNode; cls?: string }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`${cls ?? s.reveal}`}>{children}</div>;
}

function StatCell({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { ref, val } = useCountUp(target);
  return (
    <div className={s.bandCell} ref={ref}>
      <div className={s.bandN}>{val.toLocaleString()}<span>{suffix}</span></div>
      <div className={s.bandL}>{label}</div>
    </div>
  );
}

function MagLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic();
  return (
    <Link href={href} className={className} ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      style={{ transition: 'transform .25s cubic-bezier(.34,1.56,.64,1)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {children}
    </Link>
  );
}

function SvcImg({ src, alt }: { src: string; alt: string }) {
  const ref = useScrollReveal(0.06);
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 380, overflow: 'hidden' }}>
      <div ref={ref} className={`${s.svcImgReveal}`} style={{ height: '100%', minHeight: 380 }}>
        <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="(max-width:1024px)100vw,50vw" />
      </div>
    </div>
  );
}

function HIWCell({ step, delay }: { step: typeof HOW_IT_WORKS[0]; delay: number }) {
  const ref = useScrollReveal(0.1);
  return (
    <div ref={ref} className={s.hiwCell} style={{ transitionDelay: `${delay}s` }}>
      <div className={s.hiwNum}>{step.num}</div>
      <div className={s.hiwTitle}>{step.title}</div>
      <div className={s.hiwDesc}>{step.desc}</div>
      <div className={s.hiwBar}>
        <div className={s.hiwBarFill} style={{ width: step.fill }} />
      </div>
    </div>
  );
}

const Arr = () => (
  <svg className={s.arr} viewBox="0 0 15 15">
    <path d="M2 7.5h11M8.5 3.5l4 4-4 4" />
  </svg>
);

const CheckIcon = () => (
  <div className={s.featChk}>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l2.8 3 5.2-6" stroke="var(--hp-accent-dark)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/* ── MAIN COMPONENT ──────────────────────────────────────────────────── */
export default function NewHomePage() {
  const parallaxRef = useParallax(0.14);

  return (
    <>
      {/* ── HERO ── */}
      <section className={s.heroWrap} id="home" aria-label="Hero">
        <div className={s.heroBlob} ref={parallaxRef} aria-hidden="true" />
        <div className={s.wrap} style={{ position: 'relative', zIndex: 1 }}>
          <div className={s.heroGrid}>
            <div>
              <div className={s.heroEyebrow}>
                <span className={s.eyebrowBar} />
                Digital Services &amp; Virtual Internships
              </div>
              <h1 className={s.heroH1}>
                <div className={s.l1}>We Build Products</div>
                <div className={s.l2}>That Drive <span className={s.gradText}>Real</span></div>
                <div className={s.l3}>Business Results.</div>
              </h1>
              <p className={s.heroP}>
                SkillInf delivers premium website development, AI automation, UI/UX design, and 3D rendering
                for businesses — alongside a structured virtual internship program helping students build real
                skills and start careers.
              </p>
              <div className={s.heroBtns}>
                <MagLink href="/services" className={s.btnSolid}>View Our Services <Arr /></MagLink>
                <MagLink href="/internships" className={s.btnGhost}>Internship Program <Arr /></MagLink>
              </div>
              <div className={s.heroTrust}>
                {['Premium Digital Services', '1,040+ Active Interns', 'Verified Certificates', 'Career Ready Students'].map(c => (
                  <div key={c} className={s.trustPill}><span className={s.tDot} />{c}</div>
                ))}
              </div>
            </div>

            <div className={`${s.heroImgWrap} ${s.lift}`}>
              <Image src="/hero.jpg" alt="SkillInf digital services dashboard" width={800} height={460}
                style={{ width: '100%', height: 460, objectFit: 'cover' }} priority />
              <div className={s.heroBadge}>
                <span className={s.hbDot} />
                <div>
                  <div className={s.hbTxt}>Platform Live</div>
                  <div className={s.hbSub}>1,040+ active interns this batch</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className={s.marqueeTrack} aria-hidden="true">
        <div className={s.marqueeInner}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className={s.marqueeItem}>
              <span className={s.marqueeDot} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS BAND ── */}
      <div className={s.band} role="region" aria-label="Key statistics">
        <div className={s.wrap}>
          <div className={s.bandInner}>
            {STATS.map(stat => <StatCell key={stat.label} {...stat} />)}
          </div>
        </div>
      </div>

      {/* ── INTRO ── */}
      <section className={s.introWrap} aria-label="About SkillInf">
        <div className={s.wrap}>
          <div className={s.introGrid}>
            <SR cls={s.revealL}>
              <div>
                <div className={s.sk}>What We Do</div>
                <h2 className={s.sh}>One Agency.<br />Two Specialisations.</h2>
                <p className={s.sp}>
                  SkillInf operates across two focus areas. We build premium digital products for businesses —
                  websites, AI tools, design systems, and 3D visuals — and we run a structured virtual internship
                  program to develop the next generation of digital professionals.
                </p>
                <div className={s.introTags}>
                  {['Website Development', 'AI Automation', 'UI/UX Design', '3D Rendering', 'Virtual Internships'].map(t => (
                    <span key={t} className={s.introTag}>{t}</span>
                  ))}
                </div>
              </div>
            </SR>
            <SR cls={s.revealR}>
              <div className={s.introImg}>
                <Image src="/svc-web.jpg" alt="SkillInf services overview" width={600} height={360}
                  style={{ width: '100%', height: 360, objectFit: 'cover' }} />
              </div>
            </SR>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className={s.svcWrap} id="services" aria-label="Our digital services">
        <div className={s.wrap}>
          <SR>
            <div className={s.svcHeader}>
              <div>
                <div className={s.sk}>Our Services</div>
                <h2 className={s.sh}>Four Services.<br />Zero Compromise.</h2>
              </div>
              <p className={s.svcHeaderR}>
                Every service is built around one principle — deliver results that genuinely move the needle
                for your business. No templates, no shortcuts.
              </p>
            </div>
          </SR>

          {SERVICES.map(svc => (
            <SR key={svc.num}>
              <article className={`${s.svcBlock} ${svc.rev ? s.rev : ''} ${s.lift}`}>
                <div className={s.svcImgCol}>
                  <SvcImg src={svc.img} alt={svc.name} />
                </div>
                <div className={s.svcBody}>
                  <div className={s.svcNum}>Service {svc.num}</div>
                  <h3 className={s.svcName}>{svc.name}</h3>
                  <p className={s.svcDesc}>{svc.desc}</p>
                  <div className={s.svcFeats}>
                    {svc.features.map(f => (
                      <div key={f} className={s.svcFeat}><CheckIcon />{f}</div>
                    ))}
                  </div>
                  <Link href="/services" className={s.svcCta}>
                    Start a Project <Arr />
                  </Link>
                </div>
              </article>
            </SR>
          ))}
        </div>
      </section>

      {/* ── INTERNSHIP ── */}
      <section className={s.internWrap} id="internship" aria-label="Virtual Internship Program">
        <div className={s.internOrb} aria-hidden="true" />
        <div className={s.wrap}>
          <div className={s.internGrid}>
            <SR cls={s.revealL}>
              <div>
                <div className={s.internSk}>Virtual Internship</div>
                <h2 className={s.internH}>Build Real Skills.<br />Launch Your Career.</h2>
                <p className={s.internP}>
                  Our internship program is structured and accessible for students. Choose a domain, follow a
                  4-week curriculum, complete real-world projects, and earn a verified certificate.
                  The learning content is accessible to all — designed to remove every barrier to skill development.
                </p>
                <div className={s.internHighlight}>
                  <div className={s.ihN}>1,040<span>+</span></div>
                  <div className={s.ihL}>students have already enrolled and are actively building their skills and portfolios through SkillInf.</div>
                </div>
                <div className={s.internBtns}>
                  <MagLink href="/sign-in" className={s.btnAccent}>Apply Now <Arr /></MagLink>
                  <MagLink href="/internships" className={s.btnOutlineW}>Browse Programs <Arr /></MagLink>
                </div>
                <div className={s.internFeats}>
                  {['Structured 4-week program', 'Real-world portfolio projects', 'Verified certificate on completion', '9+ domains to choose from', 'Learning content accessible to all'].map(f => (
                    <div key={f} className={s.ifRow}><span className={s.ifDot} />{f}</div>
                  ))}
                </div>
              </div>
            </SR>

            <SR cls={s.revealR}>
              <div>
                <div className={s.domsLabel}>Available Domains — 2026 Batch</div>
                <div className={s.domsGrid}>
                  {INTERN_DOMAINS.map(d => (
                    <div key={d.name} className={s.domTile}>
                      <div className={s.dtName}>{d.name}</div>
                      <div className={s.dtBadge}>{d.badge}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SR>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={s.hiwWrap} id="process" aria-label="How the internship works">
        <div className={s.wrap}>
          <SR>
            <div className={s.hiwHead}>
              <div>
                <div className={s.sk}>Process</div>
                <h2 className={s.sh} style={{ marginBottom: 0 }}>How the Internship Works</h2>
              </div>
              <p className={s.hiwNote}>Six clear steps from registration to a verified certificate in your hands.</p>
            </div>
          </SR>
          <div className={s.hiwRow}>
            {HOW_IT_WORKS.map((step, i) => (
              <HIWCell key={step.num} step={step} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY + OUTCOMES ── */}
      <section className={s.whyOutWrap} aria-label="Why SkillInf and outcomes">
        <div className={s.wrap}>
          <SR>
            <div className={s.sk} style={{ marginBottom: 10 }}>Results &amp; Reasons</div>
            <h2 className={s.sh} style={{ marginBottom: 52 }}>Why It Works and What You Get</h2>
          </SR>
          <div className={s.twoCol}>
            <SR cls={s.revealL}>
              <div>
                <p className={s.colLabel}>What You Achieve</p>
                <div className={s.outcomesList}>
                  {OUTCOMES.map((o, i) => (
                    <div key={o.title} className={s.olRow}>
                      <div className={s.olN}>{String(i + 1).padStart(2, '0')}</div>
                      <div>
                        <div className={s.olTitle}>{o.title}</div>
                        <div className={s.olDesc}>{o.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SR>
            <SR cls={s.revealR}>
              <div>
                <p className={s.colLabel}>Why Choose SkillInf</p>
                <div className={s.whyCards}>
                  {WHY.map(w => (
                    <div key={w.title} className={s.whyCard}>
                      <div className={s.wcTitle}>{w.title}</div>
                      <div className={s.wcDesc}>{w.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SR>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={s.ctaWrap} id="contact" aria-label="Call to action">
        <div className={s.wrap}>
          <SR>
            <div className={`${s.ctaBox} ${s.lift}`} data-no-stamp>
              <h2 className={s.ctaH}>
                Ready to Begin <span className={s.gradText}>Your Journey?</span>
              </h2>
              <p className={s.ctaP}>
                Whether you need a premium digital product for your business or you are a student ready to build
                real skills — SkillInf is where it starts.
              </p>
              <div className={s.ctaRow}>
                <MagLink href="/sign-in" className={s.btnCtaMain}>Apply for Internship</MagLink>
                <MagLink href="/services" className={s.btnCtaSec}>Explore Services</MagLink>
              </div>
            </div>
          </SR>
        </div>
      </section>
    </>
  );
}
