'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Layers,
  FolderKanban,
  Building2,
  FileText,
  Award,
  ShieldCheck,
  Link2,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Leaf,
  Package,
  CreditCard,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navSections = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Add Content', path: '/admin/add', icon: PlusCircle },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { name: 'Internships', path: '/admin/internships', icon: BookOpen },
      { name: 'Programs', path: '/admin/programs', icon: Layers },
      { name: 'Projects', path: '/admin/projects', icon: FolderKanban },
      { name: 'Company Internships', path: '/admin/company-internships', icon: Building2 },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Applications', path: '/admin/applications', icon: FileText },
      { name: 'Certificates', path: '/admin/certificates', icon: Award },
      { name: 'Verification', path: '/admin/verification', icon: ShieldCheck },
      { name: 'LinkedIn Verify', path: '/admin/linkedin-verify', icon: Link2 },
      { name: 'Physical Certificates', path: '/admin/physical-certificates', icon: Package },
      { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* ─── Mobile top bar ─────────────────────────── */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.menuBtn}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className={styles.mobileLogo}>SKILLINF ADMIN</span>
        <div className={styles.mobileProfile}>
          <User size={18} />
        </div>
      </header>

      {/* ─── Mobile overlay ─────────────────────────── */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <Leaf size={20} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>SKILLINF</span>
            <span className={styles.logoSub}>ADMIN</span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.title} className={styles.section}>
              <span className={styles.sectionTitle}>{section.title}</span>
              <ul className={styles.navList}>
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {active && <span className={styles.activeBar} />}
                        <span className={styles.navIcon}><Icon size={18} /></span>
                        <span className={styles.navLabel}>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.footerDivider} />
          <Link href="/admin/profile" className={styles.footerLink} onClick={() => setMobileOpen(false)}>
            <User size={16} />
            <span>Admin Profile</span>
          </Link>
          <button className={styles.footerLink}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
