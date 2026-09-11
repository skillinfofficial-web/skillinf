'use client';

import { useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Send, CheckCircle, RotateCcw, Clock, MessageCircle, Phone } from 'lucide-react';
import styles from './SupportPage.module.css';

/* WhatsApp numbers */
const WA_NUMBERS = [
  { label: '+91 99946 11054', number: '919994611054' },
  { label: '+91 93426 37290', number: '919342637290' },
];

function buildWaText(name: string, email: string, mobile: string, query: string) {
  return encodeURIComponent(
    `*SkillInf Support Query*\n\n` +
    `*Name:* ${name}\n` +
    `*Email:* ${email}\n` +
    `*Mobile:* ${mobile}\n\n` +
    `*Query / Complaint:*\n${query}`
  );
}

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', query: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const text = buildWaText(form.name, form.email, form.mobile, form.query);

    /* Open WhatsApp for both numbers sequentially (slight delay for second) */
    window.open(`https://wa.me/${WA_NUMBERS[0].number}?text=${text}`, '_blank');
    setTimeout(() => {
      window.open(`https://wa.me/${WA_NUMBERS[1].number}?text=${text}`, '_blank');
    }, 800);

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1200);
  }

  function handleReset() {
    setForm({ name: '', email: '', mobile: '', query: '' });
    setSubmitted(false);
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>

        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroBadge}>
              <span className={styles.heroDot} />
              Customer Support
            </div>
            <h1 className={styles.heroTitle}>
              We&apos;re Here to <span className={styles.heroHighlight}>Help You</span>
            </h1>
            <p className={styles.heroSub}>
              Have a question, query, or complaint? Fill in the form below and our team will reach out to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className={styles.content}>
          <div className="container">
            <div className={styles.grid}>

              {/* ── Form / Success ── */}
              {submitted ? (
                <div className={styles.successCard}>
                  <div className={styles.successIcon}>
                    <CheckCircle size={36} className={styles.successIconSvg} />
                  </div>
                  <h2 className={styles.successTitle}>Message Sent!</h2>
                  <p className={styles.successMsg}>
                    Thank you, <span className={styles.successHighlight}>{form.name}</span>! Your query has been forwarded to our support team via WhatsApp.{' '}
                    <span className={styles.successHighlight}>Within 24 hours</span>, our team will reach out to you — please keep your phone handy!
                  </p>
                  <button className={styles.resetBtn} onClick={handleReset} id="support-send-another">
                    <RotateCcw size={15} />
                    Send Another Query
                  </button>
                </div>
              ) : (
                <div className={styles.formCard}>
                  <h2 className={styles.formTitle}>Send Us a Message</h2>
                  <p className={styles.formSub}>
                    All fields are required. Your message will be delivered directly to our WhatsApp support line.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                      {/* Name + Email row */}
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.label} htmlFor="support-name">
                            Full Name<span className={styles.required}>*</span>
                          </label>
                          <input
                            id="support-name"
                            name="name"
                            type="text"
                            className={styles.input}
                            placeholder="e.g. Arun Kumar"
                            value={form.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label} htmlFor="support-email">
                            Email Address<span className={styles.required}>*</span>
                          </label>
                          <input
                            id="support-email"
                            name="email"
                            type="email"
                            className={styles.input}
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="support-mobile">
                          Mobile Number<span className={styles.required}>*</span>
                        </label>
                        <input
                          id="support-mobile"
                          name="mobile"
                          type="tel"
                          className={styles.input}
                          placeholder="+91 98765 43210"
                          value={form.mobile}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      {/* Query */}
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="support-query">
                          Your Query / Complaint<span className={styles.required}>*</span>
                        </label>
                        <textarea
                          id="support-query"
                          name="query"
                          className={`${styles.input} ${styles.textarea}`}
                          placeholder="Describe your issue or question in detail…"
                          value={form.query}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={styles.submitBtn}
                      id="support-submit"
                      disabled={sending}
                    >
                      {sending ? (
                        <>Sending…</>
                      ) : (
                        <>
                          <Send size={18} />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ── Sidebar ── */}
              <aside className={styles.sidebar}>
                {/* Response time */}
                <div className={styles.infoCard}>
                  <h3 className={styles.infoTitle}>
                    <Clock size={17} className={styles.infoIcon} />
                    What to Expect
                  </h3>
                  <div className={styles.infoList}>
                    {[
                      'Your message is delivered instantly to our WhatsApp support.',
                      'Our team will review your query and respond within 24 hours.',
                      'For faster help, include as much detail as possible.',
                      'Keep your mobile number handy — we may call you back.',
                    ].map((t, i) => (
                      <div key={i} className={styles.infoItem}>
                        <span className={styles.infoDot} />
                        <p className={styles.infoText}>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp direct */}
                <div className={styles.waCard}>
                  <h3 className={styles.waTitle}>
                    <MessageCircle size={17} />
                    Direct WhatsApp
                  </h3>
                  <p className={styles.waSub}>
                    Prefer to chat directly? Reach us on WhatsApp anytime.
                  </p>
                  <div className={styles.waLinks}>
                    {WA_NUMBERS.map(({ label, number }) => (
                      <a
                        key={number}
                        href={`https://wa.me/${number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.waLink}
                        id={`support-wa-${number}`}
                      >
                        <Phone size={15} />
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
