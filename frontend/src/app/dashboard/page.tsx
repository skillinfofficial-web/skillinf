'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Dashboard.module.css';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface UserDoc {
  _id: string; name: string; email: string; domain: string;
  mobileNumber?: string;  // stored since Sept 2026; may be absent for older accounts
  startDate: string; endDate: string;
  linkedinVerified: boolean | 'pending'; linkedinPostUrl: string | null;
  steps: { step1: boolean; step2: boolean; step3: boolean; step4: boolean };
  submissions: { step1: string | null; step2: string | null; step3: string | null; step4: string | null };
  certificateUnlocked: boolean;
  paymentDone: boolean;
  physicalCertificate?: {
    paid: boolean;
    address: string;
    mobile: string;
    district: string;
    pincode: string;
    registeredAt?: string;
  } | null;
}
interface Week { week: number; deadlineDays: number; tutorialUrl: string; keyFeatures: string[]; whatYouLearn: string; }

/* ── Helpers ───────────────────────────────────────────────────────────── */
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
  ['step1', 'step2', 'step3', 'step4'].forEach(k => { if (user.steps[k as keyof typeof user.steps]) pts += 20; });
  return pts;
}

/* -- Offer Letter PDF helper -- */
async function imgToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
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
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 20; const MR = W - 20;

  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const startStr = new Date(user.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const endStr = new Date(user.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  doc.saveGraphicsState();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).setGState(new (doc as any).GState({ opacity: 0.05 }));
  doc.addImage(logoB64, 'PNG', 22, 95, 160, 80, undefined, 'FAST');
  doc.restoreGraphicsState();

  doc.setFillColor(218, 245, 233); doc.rect(0, 0, W, 44, 'F');
  doc.addImage(logoB64, 'PNG', ML, 10, 48, 24, undefined, 'FAST');
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
  doc.text(`Date: ${todayStr}`, MR, 54, { align: 'right' });

  let y = 66;
  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
  doc.text('TO,', ML, y); y += 7;
  doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  doc.text(user.name, ML, y); y += 7;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  doc.text(`Intern ID: ${user._id}`, ML, y); y += 14;

  doc.setFillColor(0, 184, 148); doc.rect(ML, y - 5, 2, 11, 'F');
  doc.setFillColor(240, 253, 248); doc.rect(ML + 2.5, y - 6, MR - ML - 2.5, 13, 'F');
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 122, 99);
  const subjectLines = doc.splitTextToSize(`Subject: Offer Letter for Internship in ${user.domain}`, MR - ML - 10);
  doc.text(subjectLines, ML + 6, y + 1); y += subjectLines.length * 7 + 11;

  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
  doc.text(`Dear ${user.name},`, ML, y); y += 10;

  const intro = 'We are delighted to inform you that you have been selected for an internship opportunity with skillinf. This internship is designed to provide you with practical industry exposure through real-world projects, guided learning, and professional mentorship.';
  const introLines = doc.splitTextToSize(intro, MR - ML);
  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
  doc.text(introLines, ML, y, { align: 'justify', maxWidth: MR - ML }); y += introLines.length * 6.2 + 8;

  const tableRows: [string, string][] = [
    ['Internship Role', `Intern - ${user.domain}`],
    ['Commencement Date', startStr],
    ['Completion Date', endStr],
    ['Work Mode', 'Remote / Project-Based'],
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

  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
  doc.text('Welcome to skillinf, and congratulations!', ML, y); y += 7;

  const body = 'Your progress and participation will be monitored throughout the internship. Successful completion will be based on your engagement, project performance, and fulfillment of the assigned internship requirements. We are excited to have you begin this learning journey with skillinf and wish you every success in your professional development.';
  const bodyLines = doc.splitTextToSize(body, MR - ML);
  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
  doc.text(bodyLines, ML, y, { align: 'justify', maxWidth: MR - ML }); y += bodyLines.length * 6.2 + 10;

  const sealY = Math.min(y, H - 60);
  doc.saveGraphicsState();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).setGState(new (doc as any).GState({ opacity: 0.80 }));
  doc.addImage(sealB64, 'PNG', ML, sealY, 38, 38, undefined, 'FAST');
  doc.restoreGraphicsState();

  const msmeW = 22; const msmeH = 17.4;
  doc.addImage(msmeB64, 'PNG', MR - msmeW, sealY + (38 - msmeH) / 2, msmeW, msmeH, undefined, 'FAST');

  const footerY = H - 14;
  doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.25); doc.line(ML, footerY - 6, MR, footerY - 6);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
  doc.text('This is an electronically generated document. No physical signature is required.', W / 2, footerY - 1, { align: 'center' });
  doc.text('For verification, contact skillinf Verification Cell.', W / 2, footerY + 3.5, { align: 'center' });
  doc.text('www.skillinf.in', W / 2, footerY + 8, { align: 'center' });

  const safeName = user.name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  doc.save(`${safeName}_skillinf_internship.pdf`);
}

/* ── Certificate PDF generator ──────────────────────────────────────────── */
async function downloadCertificate(user: UserDoc) {
  const { jsPDF } = await import('jspdf');
  const QRCode = (await import('qrcode')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297; const H = 210;

  const [templateB64] = await Promise.all([imgToBase64('/certificate-template.png')]);

  const verifyUrl = `https://skillinf.in/verify-certificate?id=${user._id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 120, margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });

  doc.addImage(templateB64, 'PNG', 0, 0, W, H, undefined, 'FAST');

  const name = user.name;
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(38);
  doc.setTextColor(26, 35, 126);
  doc.text(name, W / 2, 100, { align: 'center' });

  const nameWidth = doc.getTextWidth(name);
  const lineX1 = W / 2 - nameWidth / 2;
  const lineX2 = W / 2 + nameWidth / 2;
  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(0.5);
  doc.line(lineX1, 103, lineX2, 103);

  const startStr = new Date(user.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const endStr = new Date(user.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const bodyFontSize = 11;
  const lineH = 6.5;
  let bY = 118;
  const CX = W / 2;
  const maxW = 210;

  function drawMixedLine(segments: { text: string; bold: boolean }[], y: number) {
    let totalW = 0;
    segments.forEach(s => {
      doc.setFont('helvetica', s.bold ? 'bold' : 'normal');
      doc.setFontSize(bodyFontSize);
      totalW += doc.getTextWidth(s.text);
    });
    let curX = CX - totalW / 2;
    segments.forEach(s => {
      doc.setFont('helvetica', s.bold ? 'bold' : 'normal');
      doc.setFontSize(bodyFontSize);
      doc.setTextColor(s.bold ? 26 : 34, s.bold ? 35 : 34, s.bold ? 126 : 34);
      const w = doc.getTextWidth(s.text);
      doc.text(s.text, curX, y);
      curX += w;
    });
  }

  drawMixedLine([
    { text: 'This is to certify that ', bold: false },
    { text: name, bold: true },
    { text: ' has successfully completed the', bold: false },
  ], bY); bY += lineH;

  drawMixedLine([
    { text: user.domain, bold: true },
    { text: ' Internship at skillinf from ', bold: false },
    { text: startStr, bold: true },
    { text: ' to ', bold: false },
    { text: endStr, bold: true },
    { text: '.', bold: false },
  ], bY); bY += lineH;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(bodyFontSize);
  doc.setTextColor(34, 34, 34);
  doc.text('During the internship, the candidate successfully completed the assigned tasks,', CX, bY, { align: 'center', maxWidth: maxW }); bY += lineH;
  doc.text('activities, and projects.', CX, bY, { align: 'center', maxWidth: maxW });

  const qrX = 18; const qrY = 165; const qrSize = 22;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text(`Certificate ID:`, qrX + qrSize + 3, qrY + qrSize / 2 - 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(26, 35, 126);
  doc.text(user._id, qrX + qrSize + 3, qrY + qrSize / 2 + 3);

  const safeName = name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  doc.save(`${safeName}_skillinf_certificate.pdf`);
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserDoc | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [liUrl, setLiUrl] = useState('');
  const [liMsg, setLiMsg] = useState('');
  const [liLoad, setLiLoad] = useState(false);
  const [stepLinks, setStepLinks] = useState(['', '', '', '']);
  const [stepMsgs, setStepMsgs] = useState(['', '', '', '']);
  const [stepLoads, setStepLoads] = useState([false, false, false, false]);
  const [stepVerifying, setStepVerifying] = useState([false, false, false, false]);
  const [verifyCountdowns, setVerifyCountdowns] = useState([0, 0, 0, 0]); // seconds remaining per step

  // Payment prices
  const [eCertPrice, setECertPrice] = useState(149);
  const [physicalCertPrice, setPhysicalCertPrice] = useState(149);

  // E-cert payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payLoad, setPayLoad] = useState(false);
  const [payMsg, setPayMsg] = useState('');

  // Physical cert modal
  const [showPhysicalModal, setShowPhysicalModal] = useState(false);
  const [physicalForm, setPhysicalForm] = useState({ address: '', mobile: '', district: '', pincode: '' });
  const [physicalPayLoad, setPhysicalPayLoad] = useState(false);
  const [physicalPayMsg, setPhysicalPayMsg] = useState('');
  const [physicalSuccess, setPhysicalSuccess] = useState(false);

  // Lock tooltip
  const [showLockMsg, setShowLockMsg] = useState(false);

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
    finally { setLoading(false); }
  }, [router]);

  // Fetch payment config prices
  useEffect(() => {
    fetch('/api/admin/payment-config')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.config) {
          setECertPrice(d.config.eCertPrice ?? 149);
          setPhysicalCertPrice(d.config.physicalCertPrice ?? 149);
        }
      })
      .catch(() => {/* use defaults */});
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const signOut = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  /* ── E-Certificate payment ──────────────────────────────────────────── */
  const handleCertificatePayment = async () => {
    if (!user) return;
    setPayLoad(true); setPayMsg('');
    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: eCertPrice,
          itemName: user.domain,
          itemType: 'certificate',
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.mobileNumber || '',  // real mobile; empty string falls back to CF's validation
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        setPayMsg(orderData.error || 'Could not create order. Try again.');
        setPayLoad(false); return;
      }

      const { orderId, paymentSessionId } = orderData;
      const { load } = await import('@cashfreepayments/cashfree-js');
      const env = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox') as 'sandbox' | 'production';
      const cashfree = await load({ mode: env });

      cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' }).then(async (result) => {
        if (result.error) { setPayMsg(result.error.message || 'Payment failed. Try again.'); setPayLoad(false); return; }
        setPayMsg('Verifying payment…');
        const verRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const verData = await verRes.json();
        if (verData.success) { setPayMsg(''); setShowPayModal(false); await loadData(); }
        else { setPayMsg(verData.message || 'Could not verify payment. Contact support.'); }
        setPayLoad(false);
      });
    } catch (err) {
      setPayMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setPayLoad(false);
    }
  };

  /* ── Physical Certificate payment ───────────────────────────────────── */
  const handlePhysicalCertificatePayment = async () => {
    if (!user) return;
    const { address, mobile, district, pincode } = physicalForm;
    if (!address.trim() || !mobile.trim() || !district.trim() || !pincode.trim()) {
      setPhysicalPayMsg('Please fill in all fields.'); return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) { setPhysicalPayMsg('Mobile number must be exactly 10 digits.'); return; }
    if (!/^\d{6}$/.test(pincode.trim())) { setPhysicalPayMsg('Pincode must be exactly 6 digits.'); return; }

    setPhysicalPayLoad(true); setPhysicalPayMsg('');
    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: physicalCertPrice,
          itemName: user.domain,
          itemType: 'physical-certificate',
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: mobile.trim(),
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        setPhysicalPayMsg(orderData.error || 'Could not create order. Try again.');
        setPhysicalPayLoad(false); return;
      }

      const { orderId, paymentSessionId } = orderData;
      const { load } = await import('@cashfreepayments/cashfree-js');
      const env = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox') as 'sandbox' | 'production';
      const cashfree = await load({ mode: env });

      cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' }).then(async (result) => {
        if (result.error) { setPhysicalPayMsg(result.error.message || 'Payment failed. Try again.'); setPhysicalPayLoad(false); return; }
        setPhysicalPayMsg('Verifying payment…');
        const verRes = await fetch('/api/payment/verify-physical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, address: address.trim(), mobile: mobile.trim(), district: district.trim(), pincode: pincode.trim() }),
        });
        const verData = await verRes.json();
        if (verData.success) {
          setPhysicalPayMsg('');
          setShowPhysicalModal(false);
          setPhysicalSuccess(true);
          await loadData();
        } else {
          setPhysicalPayMsg(verData.message || 'Could not verify payment. Contact support.');
        }
        setPhysicalPayLoad(false);
      });
    } catch (err) {
      setPhysicalPayMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setPhysicalPayLoad(false);
    }
  };

  const submitLinkedin = async () => {
    setLiMsg(''); setLiLoad(true);
    try {
      const res = await fetch('/api/user/linkedin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: liUrl }) });
      const data = await res.json();
      setLiMsg(data.message);
      if (data.success) { setLiUrl(''); loadData(); }
    } catch { setLiMsg('Something went wrong.'); }
    finally { setLiLoad(false); }
  };

  const submitStep = async (idx: number) => {
    const n = idx + 1;
    const L = [...stepLoads]; L[idx] = true; setStepLoads(L);
    const M = [...stepMsgs];
    try {
      const res = await fetch('/api/user/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: n, driveLink: stepLinks[idx] }) });
      const data = await res.json();
      if (data.success) {
        const V = [...stepVerifying]; V[idx] = true; setStepVerifying(V);
        M[idx] = ''; setStepMsgs(M);
        // Random AI verification delay: 60–180 seconds
        const delaySecs = Math.floor(Math.random() * 121) + 60; // 60 to 180
        const C = [...verifyCountdowns]; C[idx] = delaySecs; setVerifyCountdowns(C);
        // Countdown ticker
        const interval = setInterval(() => {
          setVerifyCountdowns(prev => {
            const next = [...prev];
            next[idx] = Math.max(0, next[idx] - 1);
            return next;
          });
        }, 1000);
        // After delay: mark done
        setTimeout(() => {
          clearInterval(interval);
          setStepVerifying(prev => { const v = [...prev]; v[idx] = false; return v; });
          setVerifyCountdowns(prev => { const c = [...prev]; c[idx] = 0; return c; });
          loadData();
        }, delaySecs * 1000);
      } else { M[idx] = data.message; setStepMsgs(M); }
    } catch { M[idx] = 'Something went wrong.'; setStepMsgs(M); }
    finally { const L2 = [...stepLoads]; L2[idx] = false; setStepLoads(L2); }
  };

  /* Loading */
  if (loading) return (
    <div className={styles.loader}><div className={styles.spin} /><p>Loading your dashboard…</p></div>
  );
  if (!user) return null;

  const pct = progressPct(user);
  const allDone = user.certificateUnlocked;
  const eCertPaid = user.paymentDone;
  const physicalCertPaid = user.physicalCertificate?.paid === true;
  const physicalCertEnabled = eCertPaid && allDone;
  const initials = getInitials(user.name);

  let cumDays = 0;
  const dueDates = weeks.map(w => { cumDays += w.deadlineDays; return addDays(user.startDate, cumDays); });

  return (
    <div className={styles.shell}>

      {/* ══ TOPBAR ════════════════════════════════════════════════════════ */}
      <header className={styles.topbar}>
        <Link href="/" className={styles.topLogo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/skillinf-logo.png"
            alt="skillinf"
            className={styles.topLogoImg}
          />
        </Link>
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
              <div className={styles.avatarDot} />
            </div>
            <div className={styles.heroInfo}>
              <p className={styles.heroGreet}>WELCOME BACK,</p>
              <h1 className={styles.heroName}>{user.name}</h1>
              <div className={styles.domainRow}>
                <span className={styles.heroDomain}>{user.domain}</span>
                <Link
                  href="/sign-up?addDomain=1"
                  className={styles.changeDomainBtn}
                  title="Enroll in another internship domain"
                >
                  + Add New Domain
                </Link>
              </div>
              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.progressPct}>{pct}%</span>
              </div>
              <p className={styles.progressMeta}>
                Internship Progress · {fmtDate(new Date(user.startDate))} → {fmtDate(new Date(user.endDate))}
              </p>

              {/* ── Referral code + job opportunity ── */}
              {user.myReferralCode && (
                <div className={styles.referralBox}>
                  <div className={styles.referralRow}>
                    <span className={styles.referralLabel}>🎁 Your Referral Code</span>
                    <span className={styles.referralCode}>{user.myReferralCode}</span>
                  </div>
                  <p className={styles.referralHint}>
                    Share this code with friends — when they sign up using your code, you get credit!
                  </p>
                  <p className={styles.jobOpportunityText}>
                    🚀 Based on your performance, we provide job opportunities at our company.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right — quote + actions */}
          <div className={styles.heroRight}>
            <div className={styles.quoteBox}>
              <span className={styles.quoteMarks}>"</span>
              <p className={styles.quoteText}>Small steps daily<br />create big results.</p>
            </div>
            <div className={styles.heroActions}>
              {/* Download Offer Letter */}
              <button className={styles.heroActionBtn} onClick={() => downloadOfferLetter(user)}>
                <span className={styles.haBtnIcon}>📄</span>
                <span className={styles.haBtnLabel}>
                  <span className={styles.haBtnTop}>Download</span>
                  <span className={styles.haBtnSub}>Offer Letter</span>
                </span>
                <span className={styles.haBtnArrow}>→</span>
              </button>

              {/* Get Physical Certificate */}
              <div className={styles.physBtnWrap}>
                <button
                  className={`${styles.heroActionBtn} ${!physicalCertEnabled ? styles.heroActionBtnLocked : ''} ${physicalCertPaid ? styles.heroActionBtnDone : ''}`}
                  onClick={() => {
                    if (!physicalCertEnabled) {
                      setShowLockMsg(true);
                      setTimeout(() => setShowLockMsg(false), 4000);
                    } else {
                      setShowPhysicalModal(true);
                    }
                  }}
                >
                  <span className={styles.haBtnIcon}>📦</span>
                  <span className={styles.haBtnLabel}>
                    <span className={styles.haBtnTop}>{physicalCertPaid ? 'Requested' : 'Get Physical'}</span>
                    <span className={styles.haBtnSub}>{physicalCertPaid ? 'Certificate ✓' : 'Certificate'}</span>
                  </span>
                  <span className={styles.haBtnArrow}>{physicalCertEnabled ? (physicalCertPaid ? '✓' : '→') : '🔒'}</span>
                </button>
                {showLockMsg && (
                  <div className={styles.lockTooltip}>
                    First complete all 4 steps and get your e-certificate — only then this option will be enabled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ PHYSICAL CERT SUCCESS BANNER ══════════════════════════════ */}
        {physicalSuccess && (
          <div className={styles.physSuccessBanner}>
            <span className={styles.physSuccessIcon}>🎉</span>
            <div>
              <p className={styles.physSuccessTitle}>Physical Certificate Requested!</p>
              <p className={styles.physSuccessSub}>Your certificate will be delivered to your registered address within <strong>2–3 working days</strong>.</p>
            </div>
            <button className={styles.physSuccessClose} onClick={() => setPhysicalSuccess(false)}>✕</button>
          </div>
        )}

        {/* Already paid — show persistent status */}
        {physicalCertPaid && !physicalSuccess && (
          <div className={styles.physSuccessBanner}>
            <span className={styles.physSuccessIcon}>📦</span>
            <div>
              <p className={styles.physSuccessTitle}>Physical Certificate On Its Way!</p>
              <p className={styles.physSuccessSub}>Your certificate is being processed and will be delivered to your registered address within <strong>2–3 working days</strong>.</p>
            </div>
          </div>
        )}

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
                    : 'Share your offer letter on LinkedIn with #skillinf to unlock your course steps.'}
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
            <span className={styles.stepsCount}>{['step1', 'step2', 'step3', 'step4'].filter(k => user.steps[k as keyof typeof user.steps]).length} / 4 completed</span>
          </div>



          {noData ? (
            <div className={styles.noDataBox}>
              <p>📚 No course content found for <strong>{user.domain}</strong>.</p>
              <p>Ask your admin to add this domain in Company Internships.</p>
            </div>
          ) : (
            <div className={styles.stepsGrid}>
              {weeks.map((week, idx) => {
                const n = (idx + 1) as 1 | 2 | 3 | 4;
                const available = isStepAvailable(user, n);
                const done = user.steps[`step${n}` as keyof typeof user.steps];
                const dueDate = dueDates[idx];
                const dl = daysLeft(dueDate);
                const verifying = stepVerifying[idx];

                return (
                  <div key={n} className={`${styles.stepCard} ${done ? styles.stepDone : !available ? styles.stepLocked : styles.stepActive}`}>

                    <div className={styles.scTop}>
                      <div className={`${styles.scNum} ${done ? styles.scNumDone : !available ? styles.scNumLocked : styles.scNumActive}`}>{done ? '✓' : n}</div>
                      <span className={done ? styles.badgeDone : available ? styles.badgeAvail : styles.badgeLocked}>
                        {done ? 'Completed' : available ? 'Available' : 'Locked'}
                      </span>
                    </div>

                    <div className={styles.scDue}>
                      <span className={styles.scDueIcon}>📅</span>
                      <span className={styles.scDueText}>Due {fmtDate(dueDate)}</span>
                      {dl > 0 && !done && <span className={styles.scDaysLeft}>{dl}d left</span>}
                      {dl === 0 && !done && <span className={`${styles.scDaysLeft} ${styles.overdue}`}>Overdue</span>}
                    </div>

                    <h3 className={styles.scTitle}>{user.domain} — Week {n}</h3>

                    <a href={week.tutorialUrl} target="_blank" rel="noreferrer"
                      className={`${styles.ytBtn} ${!available ? styles.ytDisabled : ''}`}
                      onClick={e => !available && e.preventDefault()}>
                      <span className={styles.ytPlay}>▶</span> Watch Task Tutorial
                    </a>

                    <p className={styles.scDesc}>{week.whatYouLearn}</p>

                    <div className={styles.features}>
                      <p className={styles.featTitle}>Key Features</p>
                      <ul className={styles.featList}>
                        {week.keyFeatures.slice(0, 4).map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>

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
                          <span className={styles.verifyingDot} />
                          <div>
                            <p className={styles.verifyingTitle}>Review in Progress…</p>
                            <p className={styles.verifyingText}>Your project is being reviewed. This takes 2–3 minutes.</p>
                            {verifyCountdowns[idx] > 0 && (
                              <p className={styles.verifyingTimer}>
                                Estimated time: {Math.floor(verifyCountdowns[idx] / 60)}m {verifyCountdowns[idx] % 60}s
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {available && (
                            <input className={styles.driveInput} type="url"
                              placeholder="Paste Google Drive / project link…"
                              value={stepLinks[idx]}
                              onChange={e => { const l = [...stepLinks]; l[idx] = e.target.value; setStepLinks(l); }} />
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
              <p className={styles.certBannerTitle}>Get Your E-Certificate</p>
              <p className={styles.certBannerSub}>
                {eCertPaid
                  ? 'Payment complete — click to download your certificate!'
                  : allDone
                    ? `All steps complete! Pay ₹${eCertPrice} to unlock your certificate.`
                    : 'Complete all 4 course steps to unlock your certificate.'}
              </p>
            </div>
          </div>
          <button
            className={styles.certBannerBtn}
            disabled={(!allDone && !eCertPaid) || payLoad}
            onClick={() => {
              if (eCertPaid) { downloadCertificate(user); }
              else { setShowPayModal(true); }
            }}
          >
            {eCertPaid
              ? '⬇️ Download Certificate'
              : allDone
                ? `💳 Pay ₹${eCertPrice} & Get Certificate`
                : '🔒 Complete all steps first'}
          </button>
        </div>

        {/* ══ E-CERT PAYMENT MODAL ═══════════════════════════════════════ */}
        {showPayModal && (
          <div className={styles.payOverlay} onClick={() => { if (!payLoad) setShowPayModal(false); }}>
            <div className={styles.payCard} onClick={e => e.stopPropagation()}>
              <button className={styles.payClose} onClick={() => { if (!payLoad) { setShowPayModal(false); setPayMsg(''); } }}>✕</button>
              <div className={styles.payIcon}>🎓</div>
              <h2 className={styles.payTitle}>Unlock Your Certificate</h2>
              <p className={styles.paySub}>One-time payment for your <strong>{user.domain}</strong> internship certificate</p>
              <div className={styles.payPriceBox}>
                <span className={styles.payAmount}>₹{eCertPrice}</span>
                <span className={styles.payPriceNote}>One-time · All inclusive</span>
              </div>
              <ul className={styles.payFeatures}>
                <li>✅ Verified Digital Certificate</li>
                <li>✅ LinkedIn-shareable credential</li>
                <li>✅ Instant download after payment</li>
                <li>✅ skillinf MSME-registered seal</li>
              </ul>
              {payMsg && <p className={styles.payMsg}>{payMsg}</p>}
              <button className={styles.payBtn} disabled={payLoad} onClick={handleCertificatePayment}>
                {payLoad ? 'Processing…' : `Pay ₹${eCertPrice} with Cashfree`}
              </button>
              <p className={styles.payFooter}>🔒 Secured by Cashfree · UPI · Cards · Net Banking</p>
            </div>
          </div>
        )}

        {/* ══ PHYSICAL CERT MODAL ════════════════════════════════════════ */}
        {showPhysicalModal && (
          <div className={styles.payOverlay} onClick={() => { if (!physicalPayLoad) setShowPhysicalModal(false); }}>
            <div className={styles.physCard} onClick={e => e.stopPropagation()}>
              <button className={styles.payClose} onClick={() => { if (!physicalPayLoad) { setShowPhysicalModal(false); setPhysicalPayMsg(''); } }}>✕</button>
              <div className={styles.payIcon}>📦</div>
              <h2 className={styles.payTitle}>Get Physical Certificate</h2>
              <p className={styles.paySub}>We&apos;ll courier your certificate directly to your address within <strong>2–3 working days</strong>.</p>
              <div className={styles.payPriceBox}>
                <span className={styles.payAmount}>₹{physicalCertPrice}</span>
                <span className={styles.payPriceNote}>Includes delivery · All inclusive</span>
              </div>
              <div className={styles.physForm}>
                <label className={styles.physLabel}>Full Delivery Address</label>
                <textarea
                  className={styles.physTextarea}
                  placeholder="House No., Street, Area, Landmark…"
                  rows={3}
                  value={physicalForm.address}
                  onChange={e => setPhysicalForm(f => ({ ...f, address: e.target.value }))}
                />
                <div className={styles.physRow}>
                  <div className={styles.physFieldGroup}>
                    <label className={styles.physLabel}>Mobile Number</label>
                    <input
                      className={styles.physInput}
                      type="tel"
                      placeholder="10-digit mobile"
                      maxLength={10}
                      value={physicalForm.mobile}
                      onChange={e => setPhysicalForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>
                  <div className={styles.physFieldGroup}>
                    <label className={styles.physLabel}>Pincode</label>
                    <input
                      className={styles.physInput}
                      type="tel"
                      placeholder="6-digit pincode"
                      maxLength={6}
                      value={physicalForm.pincode}
                      onChange={e => setPhysicalForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>
                </div>
                <label className={styles.physLabel}>District</label>
                <input
                  className={styles.physInput}
                  type="text"
                  placeholder="Your district"
                  value={physicalForm.district}
                  onChange={e => setPhysicalForm(f => ({ ...f, district: e.target.value }))}
                />
              </div>
              {physicalPayMsg && <p className={styles.payMsg}>{physicalPayMsg}</p>}
              <button className={styles.payBtn} disabled={physicalPayLoad} onClick={handlePhysicalCertificatePayment}>
                {physicalPayLoad ? 'Processing…' : `Pay ₹${physicalCertPrice} & Get Physical Certificate`}
              </button>
              <p className={styles.payFooter}>🔒 Secured by Cashfree · UPI · Cards · Net Banking</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

