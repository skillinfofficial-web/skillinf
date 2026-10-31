'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import AnnouncementBar from '@/components/home/AnnouncementBar';
import styles from './ProgramsPage.module.css';

const VerifyModalDynamic = dynamic(
  () => import('@/components/event-cert/VerifyModal'),
  { ssr: false }
);

interface Program {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  platformName: string;
  platformImage: string | null;
  link: string;
}

interface EvContent {
  templateIndex: number;
  topText: string; topColor: string;
  topXPct: number; topYPct: number; topFontSize: number; topFont?: string;
  nameColor: string;
  nameXPct: number; nameYPct: number; nameFontSize: number; nameFont?: string;
  bodyText: string; bodyColor: string;
  bodyXPct: number; bodyYPct: number; bodyFontSize: number; bodyFont?: string;
  qrXPct?: number; qrYPct?: number;
}

interface EvCertInfo {
  _id: string;
  programId: string;
  programName: string;
  templates: { label: string; imageUrl: string; order: number }[];
  participants: string[];
  prizes: { label: string; email: string; templateIndex: number }[];
  contents: EvContent[];
}

/* Derive live / completed from dates */
function getStatus(startDate: string, endDate: string): 'live' | 'completed' {
  const now   = new Date();
  const start = new Date(startDate);
  const end   = new Date(endDate);
  return now >= start && now <= end ? 'live' : 'completed';
}

/* Defaults for missing fields */
function safeContent(c: Partial<EvContent>, idx: number): Required<EvContent> {
  return {
    templateIndex: idx,
    topText: c.topText ?? '', topColor: c.topColor ?? '#1a1a1a',
    topXPct: c.topXPct ?? 50, topYPct: c.topYPct ?? 28,
    topFontSize: c.topFontSize ?? 22, topFont: c.topFont ?? 'Inter, sans-serif',
    nameColor: c.nameColor ?? '#1a3a2a',
    nameXPct: c.nameXPct ?? 50, nameYPct: c.nameYPct ?? 50,
    nameFontSize: c.nameFontSize ?? 36, nameFont: c.nameFont ?? "'Times New Roman', Times, serif",
    bodyText: c.bodyText ?? '', bodyColor: c.bodyColor ?? '#1a1a1a',
    bodyXPct: c.bodyXPct ?? 50, bodyYPct: c.bodyYPct ?? 68,
    bodyFontSize: c.bodyFontSize ?? 18, bodyFont: c.bodyFont ?? 'Inter, sans-serif',
    qrXPct: c.qrXPct ?? 88, qrYPct: c.qrYPct ?? 84,
  };
}

const CERT_W = 1123;
const CERT_H = 794;
const QR_SIZE = 90;

/* Wrap text on canvas */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number,
) {
  const lines = text.split('\n');
  const all: string[] = [];
  for (const line of lines) {
    const words = line.split(' ');
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && cur) { all.push(cur); cur = w; }
      else cur = test;
    }
    all.push(cur);
  }
  const startY = y - (all.length - 1) * lineHeight / 2;
  all.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

/* Draw the full certificate on a canvas, return it */
async function buildCertCanvas(
  template: { imageUrl: string },
  contentCfg: Required<EvContent>,
  participantName: string,
  qrDataUrl: string,
): Promise<HTMLCanvasElement> {
  return new Promise<HTMLCanvasElement>((resolve) => {
    const c = document.createElement('canvas');
    c.width  = CERT_W;
    c.height = CERT_H;
    const ctx = c.getContext('2d')!;

    const drawAll = () => {
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      /* Top text */
      if (contentCfg.topText) {
        ctx.font      = `bold ${contentCfg.topFontSize}px ${contentCfg.topFont}`;
        ctx.fillStyle = contentCfg.topColor;
        wrapText(ctx, contentCfg.topText,
          contentCfg.topXPct / 100 * CERT_W,
          contentCfg.topYPct / 100 * CERT_H,
          CERT_W * 0.8, contentCfg.topFontSize * 1.4);
      }

      /* Name */
      ctx.font      = `bold ${contentCfg.nameFontSize}px ${contentCfg.nameFont}`;
      ctx.fillStyle = contentCfg.nameColor;
      ctx.fillText(
        participantName,
        contentCfg.nameXPct / 100 * CERT_W,
        contentCfg.nameYPct / 100 * CERT_H,
      );

      /* Body text */
      if (contentCfg.bodyText) {
        ctx.font      = `${contentCfg.bodyFontSize}px ${contentCfg.bodyFont}`;
        ctx.fillStyle = contentCfg.bodyColor;
        wrapText(ctx, contentCfg.bodyText,
          contentCfg.bodyXPct / 100 * CERT_W,
          contentCfg.bodyYPct / 100 * CERT_H,
          CERT_W * 0.8, contentCfg.bodyFontSize * 1.4);
      }

      /* QR code */
      const qrImg = new Image();
      qrImg.onload = () => {
        const qrX = contentCfg.qrXPct / 100 * CERT_W - QR_SIZE / 2;
        const qrY = contentCfg.qrYPct / 100 * CERT_H - QR_SIZE / 2;
        ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);
        resolve(c);
      };
      qrImg.onerror = () => resolve(c);
      qrImg.src = qrDataUrl;
    };

    /* Background image */
    if (template.imageUrl) {
      const bg = new Image();
      bg.onload  = () => { ctx.drawImage(bg, 0, 0, CERT_W, CERT_H); drawAll(); };
      bg.onerror = () => drawAll();
      bg.src = template.imageUrl;
    } else {
      drawAll();
    }
  });
}

/* ── Inner component that uses useSearchParams ─────────────────── */
function ProgramsInner() {
  const [programs,   setPrograms]   = useState<Program[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* Cert config map: programId → EvCertInfo */
  const [certMap, setCertMap] = useState<Record<string, EvCertInfo>>({});

  /* Active cert modal */
  const [certModal,   setCertModal]   = useState<{ cert: EvCertInfo } | null>(null);
  const [certName,    setCertName]    = useState('');
  const [certEmail,   setCertEmail]   = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [certErr,     setCertErr]     = useState('');

  /* Verify modal */
  const [verifyModal, setVerifyModal] = useState<{ certId: string; eventName: string; prefill?: string } | null>(null);

  /* QR-scan params */
  const searchParams = useSearchParams();

  /* Load programs */
  useEffect(() => {
    fetch('/api/programs')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPrograms(d.programs);
        else setError(d.message ?? 'Failed to load programs.');
      })
      .catch(() => setError('Network error — check your connection.'))
      .finally(() => setLoading(false));
  }, []);

  /* Load event cert configs and build map by programId */
  useEffect(() => {
    fetch('/api/event-certificates')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const map: Record<string, EvCertInfo> = {};
          (d.data as EvCertInfo[]).forEach((ec) => { map[ec.programId] = ec; });
          setCertMap(map);
        }
      })
      .catch(() => {});
  }, []);

  /* Detect QR-scan params: ?event=<certId>&verify=1&email=<encoded-email> */
  useEffect(() => {
    const eventId  = searchParams.get('event');
    const doVerify = searchParams.get('verify');
    const email    = searchParams.get('email');
    if (eventId && doVerify === '1' && email) {
      fetch(`/api/event-certificates/${eventId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setVerifyModal({
              certId:    eventId,
              eventName: d.data.programName ?? 'Event',
              prefill:   decodeURIComponent(email),
            });
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  /* Filters */
  const [statusFilter,   setStatusFilter]   = useState<'all' | 'live' | 'completed'>('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  const platformOptions = useMemo(() => {
    return Array.from(new Set(programs.map((p) => p.platformName))).sort();
  }, [programs]);

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const status = getStatus(p.startDate, p.endDate);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (platformFilter !== 'all' && p.platformName !== platformFilter) return false;
      return true;
    });
  }, [programs, statusFilter, platformFilter]);

  const clearFilters  = () => { setStatusFilter('all'); setPlatformFilter('all'); };
  const filtersActive = statusFilter !== 'all' || platformFilter !== 'all';

  /* Reset cert modal state */
  const openCertModal = useCallback((cert: EvCertInfo) => {
    setCertModal({ cert });
    setCertName(''); setCertEmail(''); setCertErr('');
  }, []);

  /* Handle certificate download — verify → track → draw → PDF */
  const handleDownloadCert = useCallback(async () => {
    if (!certModal) return;
    const name  = certName.trim();
    const email = certEmail.trim();
    if (!name)  { setCertErr('Enter your name as it should appear on the certificate.'); return; }
    if (!email) { setCertErr('Enter your registered email address.'); return; }
    setCertErr(''); setCertLoading(true);

    try {
      /* Step 1 — Verify email is registered and get template index */
      const verRes  = await fetch('/api/event-certificates/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId: certModal.cert._id, email }),
      });
      const verData = await verRes.json();
      if (!verData.success) { setCertErr(verData.message || 'Verification failed.'); return; }
      if (!verData.found)   { setCertErr('This email is not registered for this event.'); return; }

      /* Step 2 — One-download-per-email guard */
      const trackRes  = await fetch('/api/event-certificates/download-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId: certModal.cert._id, email }),
      });
      const trackData = await trackRes.json();
      if (!trackData.success) { setCertErr(trackData.message || 'Server error.'); return; }
      if (!trackData.allowed) {
        setCertErr(trackData.message || 'This email address has already downloaded a certificate for this event. Each email may download only once.');
        return;
      }

      /* Step 3 — Build canvas */
      const { templateIndex } = verData;
      const template   = certModal.cert.templates[templateIndex] ?? certModal.cert.templates[0];
      const rawContent = certModal.cert.contents.find((c) => c.templateIndex === templateIndex)
                      ?? certModal.cert.contents[0];
      if (!template || !rawContent) {
        setCertErr('Certificate template not configured. Contact support.'); return;
      }
      const contentCfg = safeContent(rawContent, templateIndex);

      const qrVal = `https://www.skillinf.in/programs?event=${certModal.cert._id}&verify=1&email=${encodeURIComponent(email)}`;
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(qrVal, { width: QR_SIZE * 2, margin: 1 });

      const canvas = await buildCertCanvas(template, contentCfg, name, qrDataUrl);

      /* Step 4 — Export as PDF (landscape A4 = 297×210 mm) */
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);

      const evName   = certModal.cert.programName.replace(/[^a-zA-Z0-9]/g, '-');
      const safeName = name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
      pdf.save(`${evName}-${safeName}-certificate.pdf`);

      /* Close modal */
      setCertModal(null);
    } catch (ex) {
      console.error(ex);
      setCertErr('Something went wrong. Please try again.');
    } finally {
      setCertLoading(false);
    }
  }, [certModal, certName, certEmail]);

  return (
    <>
      <Navbar />
      <AnnouncementBar />
      <main className={styles.main}>

        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroBadge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.heroBadgeIcon}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Events &amp; Programs
            </div>
            <h1 className={styles.heroTitle}>Explore Programs</h1>
            <p className={styles.heroSub}>
              Discover live events and programs across platforms — hover a card to open the event.
            </p>
          </div>
        </section>

        <div className="container">

          {/* Filters */}
          {!loading && programs.length > 0 && (
            <div className={styles.filterBar}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel} htmlFor="filter-status">Status</label>
                <select
                  id="filter-status"
                  className={`${styles.filterSelect} ${statusFilter !== 'all' ? styles.filterSelectActive : ''}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'live' | 'completed')}
                >
                  <option value="all">All Status</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel} htmlFor="filter-platform">Platform</label>
                <select
                  id="filter-platform"
                  className={`${styles.filterSelect} ${platformFilter !== 'all' ? styles.filterSelectActive : ''}`}
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                >
                  <option value="all">All Platforms</option>
                  {platformOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              {filtersActive && (
                <button className={styles.clearBtn} onClick={clearFilters}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
              <span className={styles.resultCount}>
                {filtered.length} program{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={styles.state}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>Loading programs...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className={styles.errorBanner}>{error}</div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className={styles.state}>
              <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <p className={styles.emptyMsg}>
                {programs.length === 0 ? 'No programs available yet.' : 'No programs match your filters.'}
              </p>
              {filtersActive && (
                <button className={styles.clearBtnLg} onClick={clearFilters}>Clear Filters</button>
              )}
            </div>
          )}

          {/* Programs Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className={styles.cardGrid}>
              {filtered.map((prog) => {
                const status = getStatus(prog.startDate, prog.endDate);
                const cert   = certMap[prog._id];
                return (
                  <div key={prog._id} className={styles.cardWrap}>
                    <a
                      href={prog.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.card}
                      id={`program-card-${prog._id}`}
                      aria-label={`Open ${prog.name}`}
                    >
                      {/* Platform image */}
                      <div className={styles.cardImgWrap}>
                        {prog.platformImage
                          ? /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={prog.platformImage} alt={prog.platformName} className={styles.cardImg} />
                          : <div className={styles.cardImgFallback}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                              </svg>
                            </div>
                        }
                        <div className={styles.viewOverlay}>
                          <span className={styles.viewOverlayBtn}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                              <path d="M7 17L17 7M17 7H7M17 7v10" />
                            </svg>
                            Open Event
                          </span>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className={styles.cardBody}>
                        <p className={styles.cardName}>{prog.name}</p>
                        <div className={styles.cardMeta}>
                          <span className={styles.cardPlatform}>{prog.platformName}</span>
                          <span className={`${styles.statusBadge} ${status === 'live' ? styles.statusLive : styles.statusCompleted}`}>
                            <span className={styles.statusDot} />
                            {status === 'live' ? 'Live' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    </a>

                    {/* Certificate + Verify buttons */}
                    {cert && (
                      <div className={styles.certStrip}>
                        <button
                          className={styles.certBtn}
                          onClick={() => openCertModal(cert)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M12 15l-2 5 2-1 2 1-2-5M8.586 2.586a2 2 0 0 1 2.828 0L12 3.172l.586-.586a2 2 0 0 1 2.828 2.828L12 8.828 8.586 5.414a2 2 0 0 1 0-2.828z" />
                            <rect x="3" y="9" width="18" height="13" rx="2" />
                          </svg>
                          Certificate
                        </button>
                        <button
                          className={styles.verifyBtn}
                          onClick={() => setVerifyModal({ certId: cert._id, eventName: cert.programName })}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                          </svg>
                          Verify
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.bottomSpacer} />
        </div>
      </main>
      <Footer />

      {/* Certificate download modal */}
      {certModal && (
        <div className={styles.modalOverlay} onClick={() => { if (!certLoading) setCertModal(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {!certLoading && (
              <button className={styles.modalClose} onClick={() => setCertModal(null)}>&#x2715;</button>
            )}
            <h2 className={styles.modalTitle}>Get Certificate</h2>
            <p className={styles.modalSub}>{certModal.cert.programName}</p>

            <div>
              <label className={styles.modalLabel}>
                Your full name
                <span className={styles.modalLabelRed}> — as it will appear on the certificate</span>
              </label>
              <input
                className={styles.modalInput}
                type="text"
                placeholder="Enter your full name"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                disabled={certLoading}
              />
            </div>

            <div>
              <label className={styles.modalLabel}>Registered email address</label>
              <input
                className={styles.modalInput}
                type="email"
                placeholder="you@example.com"
                value={certEmail}
                onChange={(e) => setCertEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleDownloadCert(); }}
                disabled={certLoading}
              />
            </div>

            {certErr && <p className={styles.modalErr}>{certErr}</p>}

            <p className={styles.modalNote}>
              Your certificate will be generated and downloaded as a PDF. Each email address may download the certificate only once.
            </p>

            <button
              className={styles.modalPrimaryBtn}
              onClick={handleDownloadCert}
              disabled={certLoading}
            >
              {certLoading ? 'Generating certificate...' : 'Download Certificate (PDF)'}
            </button>
          </div>
        </div>
      )}

      {/* Verify modal */}
      {verifyModal && (
        <VerifyModalDynamic
          certId={verifyModal.certId}
          eventName={verifyModal.eventName}
          onClose={() => setVerifyModal(null)}
          prefillEmail={verifyModal.prefill}
          autoVerify={!!verifyModal.prefill}
        />
      )}
    </>
  );
}

/* Page export wrapped in Suspense for useSearchParams */
export default function ProgramsPage() {
  return (
    <Suspense fallback={null}>
      <ProgramsInner />
    </Suspense>
  );
}
