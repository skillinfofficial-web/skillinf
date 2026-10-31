'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import styles from './ProgramsPage.module.css';

const VerifyModalDynamic = dynamic(
  () => import('@/components/event-cert/VerifyModal'),
  { ssr: false }
);

const CertCanvasDynamic = dynamic(
  () => import('@/components/event-cert/CertCanvas'),
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

interface EvCertInfo {
  _id: string;
  programId: string;
  programName: string;
  templates: { label: string; imageUrl: string; order: number }[];
  participants: string[];
  prizes: { label: string; email: string; templateIndex: number }[];
  contents: {
    templateIndex: number;
    topText: string; topColor: string;
    bodyText: string; bodyColor: string;
    nameColor: string;
    nameYPct: number; nameXPct?: number;
    topXPct?: number; topYPct?: number;
    bodyXPct?: number; bodyYPct?: number;
    topFontSize: number; nameFontSize: number; bodyFontSize: number;
  }[];
}

/* Derive live / completed from dates */
function getStatus(startDate: string, endDate: string): 'live' | 'completed' {
  const now   = new Date();
  const start = new Date(startDate);
  const end   = new Date(endDate);
  return now >= start && now <= end ? 'live' : 'completed';
}

/* ── Inner component that uses useSearchParams ─────────────────── */
function ProgramsInner() {
  const [programs,   setPrograms]   = useState<Program[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* Cert config map: programId → EvCertInfo */
  const [certMap, setCertMap] = useState<Record<string, EvCertInfo>>({});

  /* Active cert modal (Get Certificate) */
  const [certModal,  setCertModal]  = useState<{ cert: EvCertInfo } | null>(null);
  const [certName,   setCertName]   = useState('');
  const [certEmail,  setCertEmail]  = useState('');
  const [certLoading,setCertLoading]= useState(false);
  const [certErr,    setCertErr]    = useState('');
  const [certCanvas, setCertCanvas] = useState<HTMLCanvasElement | null>(null);

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
    const names = Array.from(new Set(programs.map((p) => p.platformName))).sort();
    return names;
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
    setCertName(''); setCertEmail(''); setCertErr(''); setCertCanvas(null);
  }, []);

  /* Handle certificate download */
  const handleDownloadCert = useCallback(async () => {
    if (!certModal) return;
    if (!certName.trim()) { setCertErr('Enter your name as it should appear on the certificate.'); return; }
    if (!certEmail.trim()) { setCertErr('Enter your registered email address.'); return; }
    setCertErr(''); setCertLoading(true);
    try {
      const res  = await fetch('/api/event-certificates/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId: certModal.cert._id, email: certEmail.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setCertErr(data.message || 'Verification failed.'); return; }
      const { templateIndex } = data;
      const template   = certModal.cert.templates[templateIndex] ?? certModal.cert.templates[0];
      const contentCfg = certModal.cert.contents.find((c) => c.templateIndex === templateIndex)
                      ?? certModal.cert.contents[0];
      if (!template || !contentCfg) { setCertErr('Certificate template not configured. Contact support.'); return; }
      const qrVal = `https://www.skillinf.in/programs?event=${certModal.cert._id}&verify=1&email=${encodeURIComponent(certEmail.trim())}`;

      const canvas = await new Promise<HTMLCanvasElement>((resolve) => {
        const c = document.createElement('canvas');
        c.width  = 1123;
        c.height = 794;
        const img = new Image();
        img.onload = async () => {
          const ctx = c.getContext('2d')!;
          ctx.drawImage(img, 0, 0, 1123, 794);

          /* Top text */
          ctx.font      = `bold ${contentCfg.topFontSize ?? 22}px Inter, sans-serif`;
          ctx.fillStyle = contentCfg.topColor ?? '#1a1a1a';
          ctx.textAlign = 'center';
          ctx.fillText(contentCfg.topText ?? '', (contentCfg.topXPct ?? 50) / 100 * 1123, (contentCfg.topYPct ?? 35) / 100 * 794);

          /* Name */
          ctx.font      = `bold ${contentCfg.nameFontSize ?? 36}px Inter, sans-serif`;
          ctx.fillStyle = contentCfg.nameColor ?? '#1a3a2a';
          ctx.fillText(certName.trim(), (contentCfg.nameXPct ?? 50) / 100 * 1123, (contentCfg.nameYPct ?? 50) / 100 * 794);

          /* Body text */
          ctx.font      = `${contentCfg.bodyFontSize ?? 18}px Inter, sans-serif`;
          ctx.fillStyle = contentCfg.bodyColor ?? '#1a1a1a';
          ctx.fillText(contentCfg.bodyText ?? '', (contentCfg.bodyXPct ?? 50) / 100 * 1123, (contentCfg.bodyYPct ?? 65) / 100 * 794);

          /* QR code */
          try {
            const QRCode = (await import('qrcode')).default;
            const qrDataUrl = await QRCode.toDataURL(qrVal, { width: 90, margin: 1 });
            const qrImg = new Image();
            qrImg.onload = () => {
              ctx.drawImage(qrImg, 1123 - 110, 794 - 110, 96, 96);
              resolve(c);
            };
            qrImg.src = qrDataUrl;
          } catch { resolve(c); }
        };
        img.onerror = () => resolve(c);
        img.src = template.imageUrl;
      });
      setCertCanvas(canvas);
    } catch {
      setCertErr('Something went wrong. Please try again.');
    } finally {
      setCertLoading(false);
    }
  }, [certModal, certName, certEmail]);

  const triggerDownload = useCallback(() => {
    if (!certCanvas || !certModal) return;
    const evName   = certModal.cert.programName.replace(/[^a-zA-Z0-9]/g, '-');
    const safeName = certName.trim().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
    const link     = document.createElement('a');
    link.href     = certCanvas.toDataURL('image/png');
    link.download = `${evName}-${safeName}-certificate.png`;
    link.click();
  }, [certCanvas, certModal, certName]);

  return (
    <>
      <Navbar />
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

                    {/* Certificate + Verify buttons — only for programs with a cert config */}
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
        <div className={styles.modalOverlay} onClick={() => { setCertModal(null); setCertCanvas(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => { setCertModal(null); setCertCanvas(null); }}>&#x2715;</button>
            <h2 className={styles.modalTitle}>Get Certificate</h2>
            <p className={styles.modalSub}>{certModal.cert.programName}</p>

            {!certCanvas ? (
              <>
                <label className={styles.modalLabel}>Your name (as it will appear on the certificate)</label>
                <input
                  className={styles.modalInput}
                  type="text"
                  placeholder="Enter your full name"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                />
                <label className={styles.modalLabel}>Registered email address</label>
                <input
                  className={styles.modalInput}
                  type="email"
                  placeholder="you@example.com"
                  value={certEmail}
                  onChange={(e) => setCertEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDownloadCert(); }}
                />
                {certErr && <p className={styles.modalErr}>{certErr}</p>}
                <button
                  className={styles.modalPrimaryBtn}
                  onClick={handleDownloadCert}
                  disabled={certLoading}
                >
                  {certLoading ? 'Generating...' : 'Preview Certificate'}
                </button>
              </>
            ) : (
              <>
                <p className={styles.modalSuccess}>Certificate ready — review and download below.</p>
                <canvas
                  ref={(el) => {
                    if (el && certCanvas) {
                      el.width  = certCanvas.width;
                      el.height = certCanvas.height;
                      el.getContext('2d')?.drawImage(certCanvas, 0, 0);
                    }
                  }}
                  className={styles.certPreviewCanvas}
                />
                <div className={styles.modalActions}>
                  <button className={styles.modalPrimaryBtn} onClick={triggerDownload}>
                    Download Certificate
                  </button>
                  <button className={styles.modalSecondaryBtn} onClick={() => setCertCanvas(null)}>
                    Re-enter details
                  </button>
                </div>
              </>
            )}
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
