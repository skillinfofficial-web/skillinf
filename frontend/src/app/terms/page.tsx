import type { Metadata } from 'next';
import styles from '../privacy-policy/PrivacyPolicy.module.css';

export const metadata: Metadata = {
  title: 'Terms & Conditions | SkillInf',
  description: 'Read the SkillInf Terms & Conditions for using our internship programs, training services, certificates, and website.',
  alternates: { canonical: 'https://www.skillinf.in/terms' },
  openGraph: { url: 'https://www.skillinf.in/terms' },
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.lastUpdated}>Last Updated: September 18, 2026</p>
          <h1 className={styles.title}>Terms &amp; Conditions</h1>
          <p className={styles.intro}>
            Welcome to <strong>SkillInf</strong>. By accessing our website, registering for an internship,
            purchasing a certificate or service, or participating in our internship and training programs,
            you agree to comply with the following Terms &amp; Conditions.
          </p>
        </div>
        <div className={styles.body}>
          <section className={styles.section}>
            <h2>1. About Our Services</h2>
            <p>SkillInf provides internship opportunities, learning and training programs, internship-related services, certificates, digital certificates, physical certificates, and related educational or professional development services. The specific services included in each internship or program may vary depending on the selected program.</p>
          </section>
          <section className={styles.section}>
            <h2>2. Registration and Application</h2>
            <p>When registering for an internship or program, you are required to provide accurate and complete information including your full name, email address, phone number, college or institution, course and educational details, skills and interests, and other information required for registration. You are responsible for ensuring that the information submitted is accurate. Providing false or misleading information may result in cancellation of your participation.</p>
          </section>
          <section className={styles.section}>
            <h2>3. Payment</h2>
            <p>Certain services, certificates, training programs, or other offerings may require payment. Before making a payment, you should review the applicable program details, fees, inclusions, and requirements. Once payment has been successfully completed and the applicable service or processing has commenced, the payment is generally <strong>non-refundable</strong>, except where a refund is required under applicable law or where SkillInf expressly agrees otherwise.</p>
          </section>
          <section className={styles.section}>
            <h2>4. Digital / E-Certificate</h2>
            <p>Where a digital or e-certificate is included as part of a paid service, the certificate will be issued after the applicable requirements have been completed and verified. The digital certificate may be provided electronically through the registered email address, user account, or another designated method. Once a certificate has been generated based on information provided by the participant, SkillInf may not be responsible for errors resulting from incorrect information submitted by the participant.</p>
          </section>
          <section className={styles.section}>
            <h2>5. Physical Certificate</h2>
            <p>A physical certificate may be available as a separate paid service where specifically offered. After payment and verification, the physical certificate will generally require approximately <strong>2–3 business days for delivery</strong>, depending on the delivery location, courier service, weekends, public holidays, and other circumstances beyond our control. Delivery timelines are estimates and are not guaranteed. Additional delivery charges may apply.</p>
          </section>
          <section className={styles.section}>
            <h2>6. LinkedIn Post Verification</h2>
            <p>For programs where LinkedIn posting is part of the required process, participants may be required to publish a LinkedIn post according to instructions provided by SkillInf. The next stage of the program, including access to certain course or learning sections, may be made available <strong>only after the required LinkedIn post has been successfully verified</strong>. Participants are responsible for ensuring that their LinkedIn post meets the stated requirements.</p>
          </section>
          <section className={styles.section}>
            <h2>7. Course and Learning Access</h2>
            <p>Access to specific course, learning, training, or internship sections may depend on completion of required onboarding steps. Access may also depend on successful registration, payment, verification, or other requirements specified for the particular program.</p>
          </section>
          <section className={styles.section}>
            <h2>8. Internship Participation</h2>
            <p>Participants are expected to actively participate in the internship and complete the tasks, assignments, projects, or other activities associated with their selected program. Participants should complete assigned activities within the specified period, follow program instructions, maintain professional conduct, submit genuine and original work, and provide accurate information.</p>
          </section>
          <section className={styles.section}>
            <h2>9. Certificate Eligibility</h2>
            <p>Completion or issuance of a certificate may be subject to completion of the applicable internship, training, assignments, assessments, verification steps, or other requirements. Registration or payment alone does not necessarily guarantee a completion certificate if additional eligibility requirements have not been satisfied.</p>
          </section>
          <section className={styles.section}>
            <h2>10. Certificate Verification</h2>
            <p>SkillInf may maintain records necessary to verify certificates issued by the company. Certificate verification information may include participant name, certificate ID, program or internship title, issue date, and completion status. Participants must not alter, modify, forge, duplicate, or falsely represent a certificate issued by the company.</p>
          </section>
          <section className={styles.section}>
            <h2>11. Use of Company Materials</h2>
            <p>Program materials, documents, videos, assignments, designs, logos, website content, and other materials provided by SkillInf may be protected by applicable intellectual property laws. Unless expressly permitted, participants must not resell course materials, redistribute paid content, copy or reproduce protected materials for commercial purposes, claim company-created materials as their own, or modify or misuse company certificates, logos, or official documents.</p>
          </section>
          <section className={styles.section}>
            <h2>12. Participant Conduct</h2>
            <p>Participants are expected to behave professionally and respectfully. The following activities are prohibited: fraudulent registration, providing false information, impersonation, misuse of certificates, unauthorized access to our systems, attempting to disrupt our website or services, harassment or abusive communication, copying or submitting another person&apos;s work, and any unlawful activity. We reserve the right to suspend or terminate participation where there is evidence of serious misuse, fraud, or violation of these Terms.</p>
          </section>
          <section className={styles.section}>
            <h2>13. LinkedIn and Social Media</h2>
            <p>Participants are responsible for the content they publish on their own social media accounts. Where a LinkedIn post is required for program verification, participants must ensure that the post complies with LinkedIn&apos;s applicable rules and policies. SkillInf does not control LinkedIn&apos;s platform, account policies, availability, or moderation decisions.</p>
          </section>
          <section className={styles.section}>
            <h2>14. Third-Party Services</h2>
            <p>Our website or programs may use third-party services such as payment providers, email services, cloud hosting providers, social media platforms, analytics services, or other technology providers. We are not responsible for interruptions, policy changes, account restrictions, or failures caused by third-party services.</p>
          </section>
          <section className={styles.section}>
            <h2>15. Delivery Delays</h2>
            <p>For physical certificates or other physical materials, delivery times may be affected by courier delays, incorrect address information, weather conditions, public holidays, regional restrictions, operational issues, or other circumstances outside our reasonable control. Participants are responsible for providing a correct and complete delivery address.</p>
          </section>
          <section className={styles.section}>
            <h2>16. Cancellation and Termination</h2>
            <p>SkillInf may suspend or terminate access to a program if a participant violates these Terms, provides fraudulent information, misuses company resources, attempts to manipulate the certificate or verification process, or engages in unlawful or abusive behavior. Where participation is terminated because of a participant&apos;s violation, payments already made may not be refundable, subject to applicable law.</p>
          </section>
          <section className={styles.section}>
            <h2>17. No Guarantee of Employment</h2>
            <p>Participation in an internship or training program does not guarantee employment, a job offer, salary, placement, or future career opportunity. Internship and training programs are intended to provide learning, practical exposure, and professional development opportunities.</p>
          </section>
          <section className={styles.section}>
            <h2>18. Website Availability</h2>
            <p>We make reasonable efforts to keep our website and services available. However, temporary interruptions may occur because of maintenance, technical problems, hosting issues, internet problems, or circumstances beyond our control. We do not guarantee that the website or every service will always be available without interruption.</p>
          </section>
          <section className={styles.section}>
            <h2>19. Limitation of Liability</h2>
            <p>To the extent permitted by applicable law, SkillInf will not be responsible for indirect or consequential losses arising from the use of our website, programs, third-party platforms, or services. Nothing in these Terms is intended to exclude or limit any liability or consumer right that cannot legally be excluded or limited.</p>
          </section>
          <section className={styles.section}>
            <h2>20. Privacy</h2>
            <p>Your personal information will be handled in accordance with our <a href="/privacy-policy" style={{color:'#6B9080',fontWeight:600}}>Privacy Policy</a>. By using our services, you acknowledge that you have reviewed the applicable privacy practices.</p>
          </section>
          <section className={styles.section}>
            <h2>21. Changes to These Terms</h2>
            <p>We may update these Terms &amp; Conditions from time to time. Updated terms will be published on this page with a revised Last Updated date. Your continued use of our services after an update may be subject to the revised Terms &amp; Conditions.</p>
          </section>
          <section className={styles.section}>
            <h2>22. Governing Law</h2>
            <p>These Terms &amp; Conditions will be governed by the applicable laws of India, subject to any mandatory rights and protections available to consumers or participants under applicable law.</p>
          </section>
          <section className={`${styles.section} ${styles.contactSection}`}>
            <h2>23. Contact Us</h2>
            <p>If you have any questions regarding these Terms &amp; Conditions, please contact us:</p>
            <div className={styles.contactBox}>
              <p><strong>Company:</strong> SkillInf</p>
              <p><strong>Website:</strong> <a href="https://skillinf.in" target="_blank" rel="noreferrer">skillinf.in</a></p>
              <p><strong>Email:</strong> <a href="mailto:support@skillinf.in">support@skillinf.in</a></p>
              <p><strong>Phone:</strong> +91 93426 37290 &amp; +91 99946 11054</p>
              <p><strong>Address:</strong> Remote</p>
            </div>
          </section>
          <p className={styles.acknowledge}>By registering for our programs, making a payment, or using our website and services, you acknowledge that you have read and understood these Terms &amp; Conditions.</p>
          <p className={styles.copyright}>&copy; 2026 SkillInf. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
