'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/internships', label: 'Internships' },
  { href: '/programs',    label: 'Programs'    },
  { href: '/projects',    label: 'Projects'    },
  { href: '/about',       label: 'About'       },
  { href: '/support',     label: 'Support'     },
];

export default function Navbar() {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.navContainer}`}>
        {/* Logo — PNG image */}
        <Link href="/" className={styles.logoWrap} aria-label="SkillInf Home">
          <Image
            src="/skillinf-logo.png"
            alt="SkillInf — Learn Built Grow"
            width={140}
            height={52}
            priority
            className={styles.logoImg}
          />
        </Link>

        {/* Desktop nav */}
        <nav className={styles.desktopNav}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={`${styles.navLink} ${
                pathname === href || pathname?.startsWith(href + '/') ? styles.navLinkActive : ''
              }`}
            >
              {label}
            </Link>
          ))}
          <div className={styles.pillDivider} aria-hidden="true" />
          <Link href="/sign-in" className={styles.signInBtn} id="navbar-signin-btn">Sign In</Link>
          <Link href="/sign-up" className={styles.signUpBtn} id="navbar-signup-btn">Sign Up</Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`${styles.mobileNav} ${isOpen ? styles.open : ''}`}>
        {navLinks.map(({ href, label }) => (
          <Link
            key={label}
            href={href}
            className={`${styles.mobileNavLink} ${
              pathname === href || pathname?.startsWith(href + '/') ? styles.mobileNavLinkActive : ''
            }`}
            onClick={() => setIsOpen(false)}
          >
            {label}
          </Link>
        ))}
        <div className={styles.mobileAuthRow}>
          <Link href="/sign-in" className={styles.mobileSignIn} onClick={() => setIsOpen(false)}>Sign In</Link>
          <Link href="/sign-up" className={styles.mobileSignUp} onClick={() => setIsOpen(false)}>Sign Up</Link>
        </div>
      </div>
    </header>
  );
}
