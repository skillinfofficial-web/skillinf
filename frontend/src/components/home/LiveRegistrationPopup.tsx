'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './LiveRegistrationPopup.module.css';

const NAMES = [
  'Aravind', 'Kavya', 'Karthikeyan', 'Priya', 'Santhosh',
  'Divya', 'Vignesh', 'Harini', 'Suresh', 'Keerthana',
  'Arun', 'Nandhini', 'Kavin', 'Swetha', 'Pradeep',
  'Aishwarya', 'Dinesh', 'Revathi', 'Vijay', 'Abinaya',
  'Saravanan', 'Meenakshi', 'Naveen', 'Janani', 'Surya',
  'Gayathri', 'Bharath', 'Dharani', 'Manikandan', 'Pavithra',
];

const DOMAINS = [
  'AI & Machine Learning',
  'Data Science',
  'Web Development',
  'Full Stack Development',
  'Python Development',
  'Data Analytics',
  'Cloud Computing',
  'Cybersecurity',
  'UI/UX Design',
  'Automation',
  'Software Development',
  'Generative AI',
];

function pick<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter((x) => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function LiveRegistrationPopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName]       = useState('');
  const [domain, setDomain]   = useState('');
  const lastNameRef   = useRef('');
  const lastDomainRef = useRef('');

  const showNext = () => {
    const nextName   = pick(NAMES,   lastNameRef.current);
    const nextDomain = pick(DOMAINS, lastDomainRef.current);
    lastNameRef.current   = nextName;
    lastDomainRef.current = nextDomain;
    setName(nextName);
    setDomain(nextDomain);
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  };

  useEffect(() => {
    const first    = setTimeout(showNext, 10000);
    const interval = setInterval(showNext, 35000);
    return () => { clearTimeout(first); clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`${styles.popup} ${visible ? styles.show : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.top}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.label}>JUST JOINED</span>
      </div>
      <p className={styles.text}>
        <strong>{name}</strong> just registered
      </p>
      <p className={styles.domain}>{domain}</p>
    </div>
  );
}
