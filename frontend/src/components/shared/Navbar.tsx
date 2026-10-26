'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import styles from './Navbar.module.css';

const serviceLinks = [
  { href: '/services/website',       label: 'Website Services' },
  { href: '/services/ai-automation', label: 'AI Automation'   },
  { href: '/services/ui-ux-design',  label: 'UI/UX Design'    },
  { href: '/services/3d-design',     label: '3D Design'       },
];

const navLinks = [
  { href: '/internships', label: 'Internships' },
  { href: '/programs',    label: 'Programs'    },
  { href: '/projects',    label: 'Projects'    },
  { href: '/support',     label: 'Support'     },
  { href: '/careers',     label: 'Careers'     },
  { href: '/about',       label: 'About'       },
];

export default function Navbar() {
  const [isOpen, setIsOpen]               = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [servicesOpen, setServicesOpen]   = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const pathname  = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isServiceActive = serviceLinks.some(s => pathname === s.href || pathname?.startsWith(s.href + '/'));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setIsOpen(false);
    setServicesOpen(false);
    setMobileServicesOpen(false);
  }, [pathname]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.navContainer}`}>
        {/* Logo */}
        <Link href="/" className={styles.logoWrap} aria-label="Skillinf Home">
          <Image
            src="/skillinf-logo.png"
            alt="Skillinf — Learn Built Grow"
            width={140}
            height={52}
            priority
            className={styles.logoImg}
          />
        </Link>

        {/* Desktop nav */}
        <nav className={styles.desktopNav}>
          {navLinks.slice(0, 3).map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={`${styles.navLink} nav-ul ${
                pathname === href || pathname?.startsWith(href + '/') ? styles.navLinkActive + ' active' : ''
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Services dropdown */}
          <div className={styles.servicesDropdownWrap} ref={dropdownRef}>
            <button
              id="navbar-services-btn"
              className={`${styles.navLink} ${styles.servicesBtn} ${isServiceActive ? styles.navLinkActive : ''}`}
              onClick={() => setServicesOpen(v => !v)}
              aria-expanded={servicesOpen}
              aria-haspopup="true"
            >
              Services
              <ChevronDown
                size={13}
                className={`${styles.servicesChevron} ${servicesOpen ? styles.servicesChevronOpen : ''}`}
              />
            </button>

            {servicesOpen && (
              <div className={styles.servicesDropdown} role="menu">
                {serviceLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    className={`${styles.servicesDropdownItem} ${pathname === href ? styles.servicesDropdownItemActive : ''}`}
                    onClick={() => setServicesOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {navLinks.slice(3).map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={`${styles.navLink} nav-ul ${
                pathname === href || pathname?.startsWith(href + '/') ? styles.navLinkActive + ' active' : ''
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
        {navLinks.slice(0, 3).map(({ href, label }) => (
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

        {/* Mobile services accordion */}
        <div>
          <button
            className={`${styles.mobileNavLink} ${styles.mobileServicesBtn} ${isServiceActive ? styles.mobileNavLinkActive : ''}`}
            onClick={() => setMobileServicesOpen(v => !v)}
          >
            Services
            <ChevronDown
              size={13}
              className={`${styles.servicesChevron} ${mobileServicesOpen ? styles.servicesChevronOpen : ''}`}
            />
          </button>

          {mobileServicesOpen && (
            <div className={styles.mobileServicesPanel}>
              {serviceLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.mobileServiceLink} ${pathname === href ? styles.mobileServiceLinkActive : ''}`}
                  onClick={() => { setIsOpen(false); setMobileServicesOpen(false); }}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {navLinks.slice(3).map(({ href, label }) => (
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
