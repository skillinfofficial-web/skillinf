'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './JoinWhatsapp.module.css';

const WA_LINK = 'https://whatsapp.com/channel/0029Vb8h3S589inZodPt6f1e';

export default function JoinWhatsappPage() {
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);

    // Open the WhatsApp channel in a new tab
    window.open(WA_LINK, '_blank', 'noopener,noreferrer');

    // Mark as joined in DB
    try {
      await fetch('/api/auth/join-whatsapp', { method: 'POST' });
    } catch { /* non-blocking */ }

    // Small delay so the tab opens before navigation
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className={styles.page}>
      {/* Brand */}
      <div className={styles.brand}>
        <Link href="/" className={styles.logoWrap} aria-label="skillinf Home">
          <Image
            src="/skillinf-logo.png"
            alt="skillinf"
            width={150}
            height={56}
            priority
            className={styles.logoImg}
          />
        </Link>
      </div>

      <main className={styles.main}>
        <div className={styles.card}>

          {/* WhatsApp icon */}
          <div className={styles.iconWrap}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.waIcon}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>

          {/* Heading */}
          <h1 className={styles.title}>One Last Step! 🎉</h1>
          <p className={styles.sub}>
            You&apos;re in! Join our official <strong>SkillInf WhatsApp Channel</strong> to get
            task updates, mentor announcements, and internship guidelines.
          </p>

          {/* Info box */}
          <div className={styles.infoBox}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.infoIcon}>
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
            </svg>
            <p>
              <strong>Mandatory Step</strong> — You must join the channel to access your dashboard
              and receive all important updates.
            </p>
          </div>

          {/* Join button */}
          <button
            id="join-whatsapp-btn"
            className={styles.joinBtn}
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <>
                <span className={styles.btnSpinner} />
                Joining… Redirecting to Dashboard
              </>
            ) : (
              <>
                {/* WhatsApp logo inline */}
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.btnWaIcon}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Join SkillInf WhatsApp Channel
              </>
            )}
          </button>

          <p className={styles.note}>
            After joining, you will be automatically redirected to your dashboard.
          </p>
        </div>
      </main>
    </div>
  );
}
