'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Dashboard.module.css';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface UserDoc {
  _id: string; name: string; email: string; domain: string;
  startDate: string; endDate: string;
  linkedinVerified: boolean | 'pending'; linkedinPostUrl: string | null;
  steps: { step1: boolean; step2: boolean; step3: boolean; step4: boolean };
  submissions: { step1: string | null; step2: string | null; step3: string | null; step4: string | null };
  certificateUnlocked: boolean;
  paymentDone: boolean;
}
interface Week { week: number; deadlineDays: number; tutorialUrl: string; keyFeatures: string[]; whatYouLearn: string; }

/* ── Helpers ───────────────────────────────────────────────────────────── */
function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}
function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr); d.setDate(d.getDate() + days); return d;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysLeft(dueDate: Date) {
  return Math.max(0, Math.round((dueDate.getTime() - Date.now()) / 86400000));
}
function isStepAvailable(user: UserDoc, n: 1 | 2 | 3 | 4): boolean {
  if (user.linkedinVerified !== true) return false;
  if (n === 1) return true;
  return user.steps[`step${n - 1}` as keyof typeof user.steps];
}
function getInitials(name: string) {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}
function progressPct(user: UserDoc): number {
  let pts = 0;
  if (user.linkedinVerified === true) pts += 20;
  ['step1','step2','step3','step4'].forEach(k => { if (user.steps[k as keyof typeof user.steps]) pts += 20; });
  return pts;
}

/* -- Offer Letter PDF helper -- */
async function imgToBase64(url: string): Promise<string> {
  const res  = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadOfferLetter(user: UserDoc) {
  const { jsPDF } = await import('jspdf');
  const [logoB64, sealB64, msmeB64] = await Promise.all([
    imgToBase64('/skillinf-logo.png'),
    imgToBase64('/skillinf-seal.png'),
    imgToBase64('/msme-logo.png'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W  = doc.internal.pageSize.getWidth();   // 210
  const H  = doc.internal.pageSize.getHeight();  // 297
  const ML = 20; const MR = W - 20;

  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const startStr = new Date(user.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const endStr   = new Date(user.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  /* 1 - WATERMARK logo 5% opacity behind text */
  doc.saveGraphicsState();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).setGState(new (doc as any).GState({ opacity: 0.05 }));
  doc.addImage(logoB64, 'PNG', 22, 95, 160, 80, undefined, 'FAST');
  doc.restoreGraphicsState();

  /* 2 - LIGHT GREEN HEADER BAR */
  doc.setFillColor(218, 245, 233); doc.rect(0, 0, W, 44, 'F');

  /* 3 - LOGO top-left inside header (1024x512 = 2:1 ratio -> 48x24mm) */
  doc.addImage(logoB64, 'PNG', ML, 10, 48, 24, undefined, 'FAST');

  /* 4 - DATE right-aligned below header */
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
  doc.text(`Date: ${todayStr}`, MR, 54, { align: 'right' });

  /* 5 - TO / NAME / INTERN ID */
  let y = 66;
  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
  doc.text('TO,', ML, y); y += 7;
  doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  doc.text(user.name, ML, y); y += 7;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  doc.text(`Intern ID: ${user._id}`, ML, y); y += 14;

  /* 6 - SUBJECT with left green bar */
  doc.setFillColor(0, 184, 148); doc.rect(ML, y - 5, 2, 11, 'F');
  doc.setFillColor(240, 253, 248); doc.rect(ML + 2.5, y - 6, MR - ML - 2.5, 13, 'F');
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 122, 99);
  const subjectLines = doc.splitTextToSize(`Subject: Offer Letter for Internship in ${user.domain}`, MR - ML - 10);
  doc.text(subjectLines, ML + 6, y + 1); y += subjectLines.length * 7 + 11;

  /* 7 - DEAR */
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
  doc.text(`Dear ${user.name},`, ML, y); y += 10;

  /* 8 - INTRO PARAGRAPH */
  const intro = 'We are delighted to inform you that you have been selected for an internship opportunity with Skillinf. This internship is designed to provide you with practical industry exposure through real-world projects, guided learning, and professional mentorship.';
  const introLines = doc.splitTextToSize(intro, MR - ML);
  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
  doc.text(introLines, ML, y, { align: 'justify', maxWidth: MR - ML }); y += introLines.length * 6.2 + 8;

  /* 9 - DETAILS TABLE */
  const tableRows: [string, string][] = [
    ['Internship Role',   `Intern - ${user.domain}`],
    ['Commencement Date', startStr],
    ['Completion Date',   endStr],
    ['Work Mode',         'Remote / Project-Based'],
  ];
  const valX = ML + 62; const rowH = 10;
  tableRows.forEach(([label, value], i) => {
    const ry = y + i * rowH;
    if (i % 2 === 0) { doc.setFillColor(246, 252, 249); doc.rect(ML, ry - 5.5, MR - ML, rowH, 'F'); }
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 140, 100);
    doc.text(label, ML + 4, ry);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.text(value, valX, ry);
  });
  y += tableRows.length * rowH + 12;

  /* 10 - CLOSING TEXT first */
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
  doc.text('Welcome to Skillinf, and congratulations!', ML, y); y += 7;

  /* 11 - BODY PARAGRAPH immediately below, no extra gap */
  const body = 'Your progress and participation will be monitored throughout the internship. Successful completion will be based on your engagement, project performance, and fulfillment of the assigned internship requirements. We are excited to have you begin this learning journey with Skillinf and wish you every success in your professional development.';
  const bodyLines = doc.splitTextToSize(body, MR - ML);
  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
  doc.text(bodyLines, ML, y, { align: 'justify', maxWidth: MR - ML }); y += bodyLines.length * 6.2 + 10;


  /* 12 - SEAL: 1024x1024 square -> 38x38mm, 80% opacity, left side */
  // Clamp so it never overflows page bottom (needs 38mm height + footer 20mm)
  const sealY = Math.min(y, H - 60);
  doc.saveGraphicsState();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).setGState(new (doc as any).GState({ opacity: 0.80 }));
  doc.addImage(sealB64, 'PNG', ML, sealY, 38, 38, undefined, 'FAST');
  doc.restoreGraphicsState();

  /* 13 - MSME: 1024x810 -> ratio 1.264:1 -> 22x17.4mm, right-aligned, same vertical as seal */
  const msmeW = 22; const msmeH = 17.4;
  doc.addImage(msmeB64, 'PNG', MR - msmeW, sealY + (38 - msmeH) / 2, msmeW, msmeH, undefined, 'FAST');

  /* 14 - FOOTER */
  const footerY = H - 14;
  doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.25); doc.line(ML, footerY - 6, MR, footerY - 6);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
  doc.text('This is an electronically generated document. No physical signature is required.', W / 2, footerY - 1, { align: 'center' });
  doc.text('For verification, contact Skillinf Verification Cell.', W / 2, footerY + 3.5, { align: 'center' });
  doc.text('www.skillinf.in', W / 2, footerY + 8, { align: 'center' });

  /* 15 - SAVE with correct filename */
  const safeName = user.name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  doc.save(`${safeName}_skillinf_internship.pdf`);
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<UserDoc | null>(null);
  const [weeks,   setWeeks]   = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData,  setNoData]  = useState(false);
  const [liUrl,   setLiUrl]   = useState('');
  const [liMsg,   setLiMsg]   = useState('');
  const [liLoad,  setLiLoad]  = useState(false);
  const [stepLinks,     setStepLinks]     = useState(['','','','']);
  const [stepMsgs,      setStepMsgs]      = useState(['','','','']);
  const [stepLoads,     setStepLoads]     = useState([false,false,false,false]);
  const [stepVerifying, setStepVerifying] = useState([false,false,false,false]);

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payLoad,      setPayLoad]      = useState(false);
  const [payMsg,       setPayMsg]       = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.push('/sign-in'); return; }
      const { user: u } = await meRes.json() as { user: UserDoc };
      setUser(u);
      const cr = await fetch(`/api/course?domain=${encodeURIComponent(u.domain)}`);
      const cd = await cr.json();
      if (cd.success) setWeeks(cd.weeks); else setNoData(true);
    } catch { router.push('/sign-in'); }
    finally   { setLoading(false); }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const signOut = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/'); };

  /* ── Certificate payment via Cashfree ───────────────────────────────── */
  const handleCertificatePayment = async () => {
    if (!user) return;
    setPayLoad(true); setPayMsg('');
    try {
      // 1. Create order on our API
      const orderRes  = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 149,
          itemName: user.domain,
          itemType: 'certificate',
          customerName:  user.name,
          customerEmail: user.email,
          customerPhone: '9999999999',
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        setPayMsg(orderData.error || 'Could not create order. Try again.');
        setPayLoad(false); return;
      }

      const { orderId, paymentSessionId } = orderData;

      // 2. Open Cashfree checkout
      const { load } = await import('@cashfreepayments/cashfree-js');
      const env = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox') as 'sandbox' | 'production';
      const cashfree = await load({ mode: env });

      cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      }).then(async (result) => {
        if (result.error) {
          setPayMsg(result.error.message || 'Payment failed. Try again.');
          setPayLoad(false); return;
        }
        // 3. Verify with our backend
        setPayMsg('Verifying payment…');
        const verRes  = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const verData = await verRes.json();
        if (verData.success) {
          setPayMsg('');
          setShowPayModal(false);
          await loadData();   // refresh user — paymentDone + certificateUnlocked now true
        } else {
          setPayMsg(verData.message || 'Could not verify payment. Contact support.');
        }
        setPayLoad(false);
      });
    } catch (err) {
      setPayMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setPayLoad(false);
    }
  };

  const submitLinkedin = async () => {
    setLiMsg(''); setLiLoad(true);
    try {
      const res  = await fetch('/api/user/linkedin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:liUrl})});
      const data = await res.json();
      setLiMsg(data.message);
      if (data.success) { setLiUrl(''); loadData(); }
    } catch { setLiMsg('Something went wrong.'); }
    finally  { setLiLoad(false); }
  };

  const submitStep = async (idx: number) => {
    const n = idx + 1;
    const L = [...stepLoads]; L[idx]=true; setStepLoads(L);
    const M = [...stepMsgs];
    try {
      const res  = await fetch('/api/user/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({step:n,driveLink:stepLinks[idx]})});
      const data = await res.json();
      if (data.success) {
        const V=[...stepVerifying]; V[idx]=true; setStepVerifying(V);
        M[idx]=''; setStepMsgs(M);
        setTimeout(()=>{ const V2=[...stepVerifying]; V2[idx]=false; setStepVerifying(V2); loadData(); }, 2500);
      } else { M[idx]=data.message; setStepMsgs(M); }
    } catch { M[idx]='Something went wrong.'; setStepMsgs(M); }
    finally  { const L2=[...stepLoads]; L2[idx]=false; setStepLoads(L2); }
  };

  /* Loading */
  if (loading) return (
    <div className={styles.loader}><div className={styles.spin}/><p>Loading your dashboard…</p></div>
  );
  if (!user) return null;

  const pct     = progressPct(user);
  const allDone = user.certificateUnlocked;
  const initials = getInitials(user.name);

  let cumDays = 0;
  const dueDates = weeks.map(w => { cumDays += w.deadlineDays; return addDays(user.startDate, cumDays); });

  return (
    <div className={styles.shell}>

      {/* ══ TOPBAR ════════════════════════════════════════════════════════ */}
      <header className={styles.topbar}>
        <Link href="/" className={styles.topLogo}>SKILLINF</Link>
        <nav className={styles.topNav}>
          <span className={styles.topEmail}>{user.email}</span>
          <button className={styles.signOutBtn} onClick={signOut}>Sign Out</button>
        </nav>
      </header>

      <div className={styles.pageBody}>

        {/* ══ HERO CARD ══════════════════════════════════════════════════ */}
        <div className={styles.heroCard}>

          {/* Left — avatar + info + progress */}
          <div className={styles.heroLeft}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.avatarDot}/>
            </div>
            <div className={styles.heroInfo}>
              <p className={styles.heroGreet}>WELCOME BACK,</p>
              <h1 className={styles.heroName}>{user.name}</h1>
              <span className={styles.heroDomain}>{user.domain}</span>
              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }}/>
                </div>
                <span className={styles.progressPct}>{pct}%</span>
              </div>
              <p className={styles.progressMeta}>
                Internship Progress · {fmtDate(new Date(user.startDate))} → {fmtDate(new Date(user.endDate))}
              </p>
            </div>
          </div>

          {/* Right — quote + actions */}
          <div className={styles.heroRight}>
            <div className={styles.quoteBox}>
              <span className={styles.quoteMarks}>"</span>
              <p className={styles.quoteText}>Small steps daily<br/>create big results.</p>
            </div>
            <div className={styles.heroActions}>
              <button className={styles.heroActionBtn} onClick={() => downloadOfferLetter(user)}>
                <span className={styles.haBtnIcon}>📄</span>
                <span className={styles.haBtnLabel}>
                  <span className={styles.haBtnTop}>Download</span>
                  <span className={styles.haBtnSub}>Offer Letter</span>
                </span>
                <span className={styles.haBtnArrow}>→</span>
              </button>
              <button className={`${styles.heroActionBtn} ${!allDone ? styles.heroActionBtnLocked : ''}`} disabled={!allDone}>
                <span className={styles.haBtnIcon}>🎓</span>
                <span className={styles.haBtnLabel}>
                  <span className={styles.haBtnTop}>Download</span>
                  <span className={styles.haBtnSub}>Certificate</span>
                </span>
                <span className={styles.haBtnArrow}>{allDone ? '→' : '🔒'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══ LINKEDIN CARD ══════════════════════════════════════════════ */}
        {user.linkedinVerified !== true && (
          <div className={styles.linkedinCard}>
            <div className={styles.liLeft}>
              <div className={styles.liIconBox}>
                <span className={styles.liIcon}>in</span>
              </div>
              <div>
                <p className={styles.liTitle}>
                  {user.linkedinVerified === 'pending'
                    ? '⏳ LinkedIn Verification Under Review'
                    : '⚡ LinkedIn Verification Required'}
                </p>
                <p className={styles.liSub}>
                  {user.linkedinVerified === 'pending'
                    ? 'Our team will verify within 3–4 hours. Step 1 unlocks on approval.'
                    : 'Share your offer letter on LinkedIn with #SkillInf to unlock your course steps.'}
                </p>
              </div>
            </div>
            {user.linkedinVerified !== 'pending' && (
              <div className={styles.liRight}>
                <div className={styles.liInputRow}>
                  <input className={styles.liInput} type="url"
                    placeholder="Paste LinkedIn post / article URL…"
                    value={liUrl} onChange={e => setLiUrl(e.target.value)} />
                  <button className={styles.liSubmitBtn} onClick={submitLinkedin} disabled={liLoad || !liUrl.trim()}>
                    {liLoad ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
                {liMsg && <p className={styles.liMsg}>{liMsg}</p>}
              </div>
            )}
            {user.linkedinVerified === 'pending' && user.linkedinPostUrl && (
              <a href={user.linkedinPostUrl} target="_blank" rel="noreferrer" className={styles.liViewLink}>
                View submitted post →
              </a>
            )}
          </div>
        )}

        {/* ══ STEPS SECTION ══════════════════════════════════════════════ */}
        <div className={styles.stepsSection}>
          <div className={styles.stepsSectionHead}>
            <div>
              <h2 className={styles.stepsSectionTitle}>Course Journey</h2>
              <p className={styles.stepsSectionSub}>Complete each step sequentially to unlock your certificate</p>
            </div>
            <span className={styles.stepsCount}>{['step1','step2','step3','step4'].filter(k=>user.steps[k as keyof typeof user.steps]).length} / 4 completed</span>
          </div>

          {noData ? (
            <div className={styles.noDataBox}>
              <p>📚 No course content found for <strong>{user.domain}</strong>.</p>
              <p>Ask your admin to add this domain in Company Internships.</p>
            </div>
          ) : (
            <div className={styles.stepsGrid}>
              {weeks.map((week, idx) => {
                const n         = (idx + 1) as 1 | 2 | 3 | 4;
                const available = isStepAvailable(user, n);
                const done      = user.steps[`step${n}` as keyof typeof user.steps];
                const dueDate   = dueDates[idx];
                const dl        = daysLeft(dueDate);
                const verifying = stepVerifying[idx];

                return (
                  <div key={n} className={`${styles.stepCard} ${done ? styles.stepDone : !available ? styles.stepLocked : styles.stepActive}`}>

                    {/* Card top row */}
                    <div className={styles.scTop}>
                      <div className={`${styles.scNum} ${done ? styles.scNumDone : !available ? styles.scNumLocked : styles.scNumActive}`}>{done ? '✓' : n}</div>
                      <span className={done ? styles.badgeDone : available ? styles.badgeAvail : styles.badgeLocked}>
                        {done ? 'Completed' : available ? 'Available' : 'Locked'}
                      </span>
                    </div>

                    {/* Due date */}
                    <div className={styles.scDue}>
                      <span className={styles.scDueIcon}>📅</span>
                      <span className={styles.scDueText}>Due {fmtDate(dueDate)}</span>
                      {dl > 0 && !done && <span className={styles.scDaysLeft}>{dl}d left</span>}
                      {dl === 0 && !done && <span className={`${styles.scDaysLeft} ${styles.overdue}`}>Overdue</span>}
                    </div>

                    {/* Title */}
                    <h3 className={styles.scTitle}>{user.domain} — Week {n}</h3>

                    {/* Tutorial button */}
                    <a href={week.tutorialUrl} target="_blank" rel="noreferrer"
                      className={`${styles.ytBtn} ${!available ? styles.ytDisabled : ''}`}
                      onClick={e => !available && e.preventDefault()}>
                      <span className={styles.ytPlay}>▶</span> Watch Task Tutorial
                    </a>

                    {/* Description */}
                    <p className={styles.scDesc}>{week.whatYouLearn}</p>

                    {/* Key features */}
                    <div className={styles.features}>
                      <p className={styles.featTitle}>Key Features</p>
                      <ul className={styles.featList}>
                        {week.keyFeatures.slice(0, 4).map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>

                    {/* Submit / status area — always at bottom */}
                    <div className={styles.scBottom}>
                      {done ? (
                        <div className={styles.doneRow}>
                          <span className={styles.doneIcon}>✓</span> Work submitted
                          {user.submissions[`step${n}` as keyof typeof user.submissions] && (
                            <a href={user.submissions[`step${n}` as keyof typeof user.submissions]!}
                              target="_blank" rel="noreferrer" className={styles.viewLink}>· View</a>
                          )}
                        </div>
                      ) : verifying ? (
                        <div className={styles.verifyingRow}>
                          <span className={styles.verifyingDot}/>
                          Verifying… done in 2–3 min
                        </div>
                      ) : (
                        <>
                          {available && (
                            <input className={styles.driveInput} type="url"
                              placeholder="Paste Google Drive / project link…"
                              value={stepLinks[idx]}
                              onChange={e => { const l=[...stepLinks]; l[idx]=e.target.value; setStepLinks(l); }} />
                          )}
                          {stepMsgs[idx] && <p className={styles.stepErrMsg}>{stepMsgs[idx]}</p>}
                          <button className={`${styles.submitBtn} ${!available ? styles.submitBtnLocked : ''}`}
                            disabled={!available || stepLoads[idx] || !stepLinks[idx]?.trim()}
                            onClick={() => submitStep(idx)}>
                            {stepLoads[idx] ? 'Submitting…' : !available ? '🔒 Locked' : 'Submit Work'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ CERTIFICATE BANNER ═════════════════════════════════════════ */}
        <div className={styles.certBanner}>
          <div className={styles.certBannerLeft}>
            <span className={styles.certBannerIcon}>🎓</span>
            <div>
              <p className={styles.certBannerTitle}>Get Your Certificate</p>
              <p className={styles.certBannerSub}>
                {user.paymentDone
                  ? 'Payment complete — your certificate is unlocked!'
                  : allDone
                  ? 'All steps complete! Pay ₹149 to unlock your certificate.'
                  : 'Complete all 4 course steps to unlock your certificate.'}
              </p>
            </div>
          </div>
          <button
            className={styles.certBannerBtn}
            disabled={!allDone || payLoad}
            onClick={() => {
              if (user.paymentDone) return;   // already paid
              setShowPayModal(true);
            }}
          >
            {user.paymentDone
              ? '✅ Certificate Unlocked'
              : allDone
              ? '💳 Pay ₹149 & Get Certificate'
              : '🔒 Complete all steps first'}
          </button>
        </div>

        {/* ══ PAYMENT MODAL ══════════════════════════════════════════════ */}
        {showPayModal && (
          <div className={styles.payOverlay} onClick={() => { if (!payLoad) setShowPayModal(false); }}>
            <div className={styles.payCard} onClick={e => e.stopPropagation()}>
              <button className={styles.payClose} onClick={() => { if (!payLoad) { setShowPayModal(false); setPayMsg(''); } }}>✕</button>
              <div className={styles.payIcon}>🎓</div>
              <h2 className={styles.payTitle}>Unlock Your Certificate</h2>
              <p className={styles.paySub}>One-time payment for your <strong>{user.domain}</strong> internship certificate</p>
              <div className={styles.payPriceBox}>
                <span className={styles.payAmount}>₹149</span>
                <span className={styles.payPriceNote}>One-time · All inclusive</span>
              </div>
              <ul className={styles.payFeatures}>
                <li>✅ Verified Digital Certificate</li>
                <li>✅ LinkedIn-shareable credential</li>
                <li>✅ Instant download after payment</li>
                <li>✅ SkillInf MSME-registered seal</li>
              </ul>
              {payMsg && <p className={styles.payMsg}>{payMsg}</p>}
              <button
                className={styles.payBtn}
                disabled={payLoad}
                onClick={handleCertificatePayment}
              >
                {payLoad ? 'Processing…' : 'Pay ₹149 with Cashfree'}
              </button>
              <p className={styles.payFooter}>🔒 Secured by Cashfree · UPI · Cards · Net Banking</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
