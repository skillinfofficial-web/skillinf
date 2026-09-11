'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';
import ApplyModal from '@/components/catalog/ApplyModal';

const navLinks = [
  { href: '/internships', label: 'Internships' },
  { href: '/programs', label: 'Programs' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About Us' },
  { href: '/support', label: 'Customer Support' },
];

export default function Navbar() {
  const [isOpen, setIsOpen]       = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={`container ${styles.navContainer}`}>
          <Link href="/" className={styles.logo}>SKILLINF</Link>

          <nav className={styles.desktopNav}>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${pathname === href || pathname?.startsWith(href + '/') ? styles.navLinkActive : ''}`}
              >
                {label}
              </Link>
            ))}
            <button className={styles.ctaButton} id="navbar-apply-btn" onClick={() => setApplyOpen(true)}>Apply Now</button>
          </nav>

          <button className={styles.mobileMenuBtn} onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`${styles.mobileNav} ${isOpen ? styles.open : ''}`}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>{label}</Link>
          ))}
          <button className={styles.mobileCtaButton} onClick={() => { setIsOpen(false); setApplyOpen(true); }}>Apply Now</button>
        </div>
      </header>

      <ApplyModal isOpen={applyOpen} onClose={() => setApplyOpen(false)} />
    </>
  );
}
