'use client';

import { useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Send, CheckCircle, RotateCcw, Clock, MessageCircle, Phone } from 'lucide-react';
import styles from './SupportPage.module.css';

/* WhatsApp numbers */
const WA_NUMBERS = [
  { label: '+91 94899 22054', number: '919489922054' },
];

function buildWaText(name: string, email: string, mobile: string, userType: string, query: string) {
  return encodeURIComponent(
    `*Skillinf Support Query*\n\n` +
    `*Name:* ${name}\n` +
    `*Email:* ${email}\n` +
    `*Mobile:* ${mobile}\n` +
    `*User Type:* ${userType}\n\n` +
    `*Query / Complaint:*\n${query}`
  );
}

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', userType: '', query: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const text = buildWaText(form.name, form.email, form.mobile, form.userType || 'Not specified', form.query);

    window.open(`https://wa.me/${WA_NUMBERS[0].number}?text=${text}`, '_blank');

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1200);
  }

  function handleReset() {
    setForm({ name: '', email: '', mobile: '', userType: '', query: '' });
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

                      {/* User Type */}
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="support-user-type">
                          I am a<span className={styles.required}>*</span>
                        </label>
                        <select
                          id="support-user-type"
                          name="userType"
                          className={styles.input}
                          value={form.userType}
                          onChange={e => setForm(prev => ({ ...prev, userType: e.target.value }))}
                          required
                        >
                          <option value="" disabled>Select user type…</option>
                          <option value="Student">Student</option>
                          <option value="Client">Client</option>
                        </select>
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

        {/* SEO: FAQ / info section for crawlers */}
        <section style={{ padding: '48px 0', background: 'var(--background)' }}>
          <div className="container">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: 'var(--main-text)' }}>
              Help &amp; Support Centre &mdash; Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '12px' }}>
              Our support centre is available to help students, interns, and clients with any queries related to Skillinf programs, certificates, payments, and services. Whether you have a question about enrolling in an internship, downloading your certificate, or understanding our services, our team is here to assist you.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '24px' }}>
              Skillinf offers free virtual internship programs across domains such as AI and Machine Learning, Web Development, Data Science, Python, Cybersecurity, UI/UX Design, and more. Our students receive a verifiable digital certificate upon successful completion of their 30-day internship program.
            </p>
            <h3 style={{ fontWeight: 700, marginTop: '24px', marginBottom: '12px', color: 'var(--main-text)' }}>Common Questions</h3>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '10px' }}>
              <strong>How do I contact support?</strong> Fill in the form above or message us directly on WhatsApp. Our team responds within 24 hours on working days.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '10px' }}>
              <strong>What can the support centre help me with?</strong> Internship enrollment issues, certificate downloads, payment queries, program access problems, account login issues, and service enquiries from clients.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '10px' }}>
              <strong>How long does it take to get a reply?</strong> We aim to respond within 24 hours on working days. For urgent matters, use the direct WhatsApp link provided on this page.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '10px' }}>
              <strong>Can I get support in Hindi or regional languages?</strong> Yes, our support team can assist in English, Hindi, and Tamil.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '10px' }}>
              <strong>What if I have not received my certificate?</strong> If your 30-day internship is complete and your LinkedIn verification post has been approved, your certificate will be available from your dashboard. If not, contact our support centre with your registered email address and we will resolve it promptly.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75 }}>
              <strong>Are Skillinf internship certificates valid for placement?</strong> Yes. Skillinf certificates are digitally verifiable and can be shared with employers and on LinkedIn. Each certificate has a unique ID that can be verified on our certificate verification page.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
