'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import styles from './FloatingChat.module.css';

export default function FloatingChat() {
  const pathname = usePathname();
  const router = useRouter();

  /* Don't show on the support page itself */
  if (pathname === '/support') return null;

  return (
    <button
      className={styles.fab}
      onClick={() => router.push('/support')}
      aria-label="Customer Support"
      id="floating-chat-btn"
    >
      <MessageCircle size={24} />
      <span className={styles.tooltip}>Customer Support</span>
    </button>
  );
}
