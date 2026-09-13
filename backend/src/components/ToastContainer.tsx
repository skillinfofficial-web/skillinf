'use client';

import React from 'react';
import { useNotifications } from './NotificationProvider';
import { X, UserPlus, Package, Link2 } from 'lucide-react';
import styles from './ToastContainer.module.css';

const ICONS = {
  application: { icon: UserPlus,  color: '#7c3aed', bg: '#ede9fe' },
  physical:    { icon: Package,   color: '#d97706', bg: '#fef3c7' },
  linkedin:    { icon: Link2,     color: '#0a66c2', bg: '#dbeafe' },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map(toast => {
        const { icon: Icon, color, bg } = ICONS[toast.type];
        return (
          <div key={toast.id} className={styles.toast}>
            <div className={styles.toastBar} style={{ background: color }} />
            <div className={styles.iconWrap} style={{ background: bg }}>
              <Icon size={18} color={color} />
            </div>
            <div className={styles.content}>
              <p className={styles.toastTitle}>{toast.title}</p>
              <p className={styles.toastBody}>{toast.body}</p>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
