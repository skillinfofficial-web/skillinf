import type { Metadata } from 'next';
import styles from './PrivacyPolicy.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | skillinf',
  description: 'Read the skillinf Privacy Policy. Learn how we collect, use, and protect your personal information when you use our internship platform.',
  alternates: { canonical: 'https://www.skillinf.in/privacy-policy' },
  openGraph: { url: 'https://www.skillinf.in/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.lastUpdated}>Last Updated: September 18, 2026</p>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.intro}>
            At <strong>skillinf</strong>, we respect your privacy and are committed to protecting the personal
            information you provide when using our website, internship programs, training services, and related services.
          </p>
        </div>
        <div className={styles.body}>
          <section className={styles.section}>
            <h2>1. Information We Collect</h2>
            <p>We may collect the following information when you register, apply for an internship, contact us, or use our website:</p>
            <ul>
              <li>Full name, email address, phone number</li>
              <li>Educational information, college or institution name</li>
              <li>Course, department, and year of study</li>
              <li>Resume or CV, skills and areas of interest</li>
              <li>Internship preferences and form submissions</li>
              <li>Payment information, where applicable</li>
              <li>Certificate-related information</li>
              <li>Website usage and technical information (IP address, browser type, device info, pages visited)</li>
            </ul>
            <p>You should only provide information that is accurate and necessary for the service you are requesting.</p>
          </section>
          <section className={styles.section}>
            <h2>2. How We Use Your Information</h2>
            <p>We may use your information to process and manage internship applications, provide internship and training opportunities, communicate with applicants and participants, verify submitted information, provide internship completion certificates, respond to support requests, process payments, improve our services, send service-related communications, prevent fraud, and comply with applicable legal requirements.</p>
          </section>
          <section className={styles.section}>
            <h2>3. Internship Applications</h2>
            <p>When you apply for an internship through our website, the information you provide may be reviewed by our team for the purpose of evaluating and managing your application. If additional information is required, we may contact you using the contact details you provide.</p>
          </section>
          <section className={styles.section}>
            <h2>4. Certificates</h2>
            <p>Information such as your name, internship title, completion details, and certificate ID may be retained to verify certificates issued by skillinf. Where certificate verification is provided publicly, only the information necessary for verification will be displayed.</p>
          </section>
          <section className={styles.section}>
            <h2>5. Communication</h2>
            <p>We may contact you through email, phone, WhatsApp, or other communication channels. Communications may relate to internship applications, selection or onboarding, training information, certificate issuance, account updates, and support requests.</p>
          </section>
          <section className={styles.section}>
            <h2>6. Sharing of Information</h2>
            <p>We do not sell or rent your personal information. We may share information when reasonably necessary with service providers, payment processors, technology and hosting providers, authorized training partners, government authorities when legally required, and professional advisers.</p>
          </section>
          <section className={styles.section}>
            <h2>7. Data Security</h2>
            <p>We take reasonable technical and organizational measures to protect your personal information. However, no method of electronic transmission can be guaranteed to be completely secure.</p>
          </section>
          <section className={styles.section}>
            <h2>8. Data Retention</h2>
            <p>We retain personal information only for as long as reasonably necessary to provide our services, maintain records, resolve disputes, or comply with applicable legal requirements.</p>
          </section>
          <section className={styles.section}>
            <h2>9. Cookies and Analytics</h2>
            <p>Our website may use cookies and similar technologies to improve website functionality and analyze performance. You may be able to control cookies through your browser settings.</p>
          </section>
          <section className={styles.section}>
            <h2>10. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices of those websites and recommend reviewing their privacy policies before providing personal information.</p>
          </section>
          <section className={styles.section}>
            <h2>11. Children&apos;s Privacy</h2>
            <p>We do not knowingly collect personal information from children where such collection is prohibited by applicable law. If you believe a child has provided personal information to us improperly, please contact us.</p>
          </section>
          <section className={styles.section}>
            <h2>12. Your Privacy Rights</h2>
            <p>Depending on applicable law, you may have rights including: access to information we hold about you, correction of inaccurate information, deletion of information where legally applicable, withdrawal of consent, objection to or restriction of certain processing, and information about how your data is used. Contact us to exercise these rights.</p>
          </section>
          <section className={styles.section}>
            <h2>13. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any updated version will be published on this page with a revised Last Updated date.</p>
          </section>
          <section className={`${styles.section} ${styles.contactSection}`}>
            <h2>14. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:</p>
            <div className={styles.contactBox}>
              <p><strong>Company:</strong> skillinf</p>
              <p><strong>Website:</strong> <a href="https://skillinf.in" target="_blank" rel="noreferrer">skillinf.in</a></p>
              <p><strong>Email:</strong> <a href="mailto:support@skillinf.in">support@skillinf.in</a></p>
              <p><strong>Phone:</strong> +91 93426 37290 &amp; +91 99946 11054</p>
              <p><strong>Address:</strong> Remote</p>
            </div>
          </section>
          <p className={styles.acknowledge}>By using our website or submitting information through our forms, you acknowledge that you have read this Privacy Policy.</p>
          <p className={styles.copyright}>&copy; 2026 skillinf. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
