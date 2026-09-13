'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

/* ── Types ────────────────────────────────────────────────── */
export interface NotifToast {
  id: string;
  type: 'application' | 'physical' | 'linkedin';
  title: string;
  body: string;
}

interface NotifCounts {
  applicationCount: number;
  physicalCertCount: number;
  linkedinPendingCount: number;
}

interface NotifCtx {
  toasts: NotifToast[];
  unread: number;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

const POLL_MS = 30_000; // poll every 30 seconds
const LS_KEY  = 'skillinf_admin_notif_counts';

const NotificationContext = createContext<NotifCtx>({
  toasts: [], unread: 0,
  dismissToast: () => {}, clearAll: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

/* ── Provider ─────────────────────────────────────────────── */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts]   = useState<NotifToast[]>([]);
  const [unread, setUnread]   = useState(0);
  const prevCounts = useRef<NotifCounts | null>(null);

  /* Load last-known counts from localStorage on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) prevCounts.current = JSON.parse(saved);
    } catch { /* ignore */ }
  }, []);

  const addToast = (t: Omit<NotifToast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(p => [...p, { ...t, id }]);
    setUnread(n => n + 1);
    // auto-dismiss after 7 s
    setTimeout(() => {
      setToasts(p => p.filter(x => x.id !== id));
    }, 7000);
  };

  const poll = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications');
      const data = await res.json();
      if (!data.success) return;

      const curr: NotifCounts = data.counts;
      const prev = prevCounts.current;

      if (prev) {
        // New application registered
        if (curr.applicationCount > prev.applicationCount) {
          const diff = curr.applicationCount - prev.applicationCount;
          addToast({
            type: 'application',
            title: `${diff} New Application${diff > 1 ? 's' : ''}!`,
            body: `${diff} new intern${diff > 1 ? 's have' : ' has'} registered.`,
          });
        }
        // New physical certificate request
        if (curr.physicalCertCount > prev.physicalCertCount) {
          const diff = curr.physicalCertCount - prev.physicalCertCount;
          addToast({
            type: 'physical',
            title: `${diff} Physical Cert Request${diff > 1 ? 's' : ''}!`,
            body: `${diff} intern${diff > 1 ? 's' : ''} paid for physical certificate delivery.`,
          });
        }
        // New LinkedIn pending verification
        if (curr.linkedinPendingCount > prev.linkedinPendingCount) {
          const diff = curr.linkedinPendingCount - prev.linkedinPendingCount;
          addToast({
            type: 'linkedin',
            title: `${diff} LinkedIn Verification${diff > 1 ? 's' : ''} Pending`,
            body: `${diff} intern${diff > 1 ? 's' : ''} submitted LinkedIn post for review.`,
          });
        }
      }

      // Save current as new baseline
      prevCounts.current = curr;
      localStorage.setItem(LS_KEY, JSON.stringify(curr));
    } catch { /* silent fail */ }
  }, []);

  /* Poll on mount immediately, then every 30 s */
  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  const dismissToast = (id: string) => {
    setToasts(p => p.filter(x => x.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
    setUnread(0);
  };

  return (
    <NotificationContext.Provider value={{ toasts, unread, dismissToast, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}
