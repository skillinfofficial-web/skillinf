'use client';

import React, { useState } from 'react';
import { Bell, X, UserPlus, Package, Link2, CheckCheck } from 'lucide-react';
import { useNotifications, NotifToast } from './NotificationProvider';
import styles from './NotificationBell.module.css';

const TYPE_META = {
  application: { icon: UserPlus, color: '#7c3aed', bg: '#ede9fe', label: 'Application' },
  physical:    { icon: Package,  color: '#d97706', bg: '#fef3c7', label: 'Physical Cert' },
  linkedin:    { icon: Link2,    color: '#0a66c2', bg: '#dbeafe', label: 'LinkedIn' },
};

export default function NotificationBell() {
  const { toasts, unread, dismissToast, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <button
        className={styles.bell}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        <Bell size={18} className={unread > 0 ? styles.bellActive : ''} />
        {unread > 0 && (
          <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.dropHeader}>
              <span className={styles.dropTitle}>Notifications</span>
              {toasts.length > 0 && (
                <button className={styles.clearBtn} onClick={() => { clearAll(); setOpen(false); }}>
                  <CheckCheck size={13} /> Clear all
                </button>
              )}
              <button className={styles.dropClose} onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            </div>

            {toasts.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={28} className={styles.emptyIcon} />
                <p>No new notifications</p>
                <span>You&apos;re all caught up! New applications and certificate requests will appear here.</span>
              </div>
            ) : (
              <ul className={styles.list}>
                {[...toasts].reverse().map((t: NotifToast) => {
                  const { icon: Icon, color, bg, label } = TYPE_META[t.type];
                  return (
                    <li key={t.id} className={styles.item}>
                      <div className={styles.itemIcon} style={{ background: bg }}>
                        <Icon size={15} color={color} />
                      </div>
                      <div className={styles.itemBody}>
                        <span className={styles.itemLabel} style={{ color }}>{label}</span>
                        <p className={styles.itemTitle}>{t.title}</p>
                        <p className={styles.itemText}>{t.body}</p>
                      </div>
                      <button className={styles.itemClose} onClick={() => dismissToast(t.id)}>
                        <X size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
