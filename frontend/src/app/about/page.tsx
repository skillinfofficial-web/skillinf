import type { Metadata } from 'next';
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about SkillInf — our mission to help students gain real-world internship experience, build portfolios, and become career-ready through structured virtual internship programs.',
  alternates: { canonical: 'https://www.skillinf.in/about' },
  openGraph: { url: 'https://www.skillinf.in/about' },
};


import {
  Target,
  Eye,
  BookOpen,
  Wrench,
  Layers,
  Star,
  Briefcase,
  GraduationCap,
  FileCode2,
  Award,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import styles from "./AboutPage.module.css";

export const metadata = {
  title: "About Us | SkillInf",
  description:
    "Learn about SkillInf — our mission to make practical learning accessible to every student through structured programs, internships, and real-world projects.",
};

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

const howWeHelp = [
  {
    icon: <BookOpen size={24} className={styles.stepIcon} />,
    title: "Learn",
    text: "Build a strong foundation through structured learning paths and carefully organized content.",
  },
  {
    icon: <Wrench size={24} className={styles.stepIcon} />,
    title: "Practice",
    text: "Strengthen your understanding through exercises, tasks, and practical challenges.",
  },
  {
    icon: <Layers size={24} className={styles.stepIcon} />,
    title: "Build",
    text: "Apply your knowledge to projects inspired by real-world problems and use cases.",
  },
  {
    icon: <Star size={24} className={styles.stepIcon} />,
    title: "Review & Improve",
    text: "Identify gaps, receive feedback, and improve your implementation and problem-solving approach.",
  },
  {
    icon: <Award size={24} className={styles.stepIcon} />,
    title: "Showcase",
    text: "Document your work and prepare projects for your portfolio, GitHub, LinkedIn, and resume.",
  },
];

const offers = [
  {
    icon: <Briefcase size={24} className={styles.offerIcon} />,
    title: "Internships",
    text: "Gain practical experience through structured internship experiences designed around learning, project work, and skill development.",
    href: "/sign-up",
    cta: "Explore Internships",
  },
  {
    icon: <GraduationCap size={24} className={styles.offerIcon} />,
    title: "Programs",
    text: "Develop focused technical skills through structured, project-oriented programs that help learners progress from fundamentals to practical implementation.",
    href: "/sign-up",
    cta: "Explore Programs",
  },
  {
    icon: <FileCode2 size={24} className={styles.offerIcon} />,
    title: "Projects",
    text: "Explore practical projects built around real-world problems and technology use cases — work to understand, learn from, and showcase.",
    href: "/projects",
    cta: "Explore Projects",
  },
];

const differentiators = [
  {
    icon: <Wrench size={20} className={styles.diffIcon} />,
    title: "Practical Learning",
    text: "We focus on applying knowledge rather than relying only on theoretical learning.",
  },
  {
    icon: <Layers size={20} className={styles.diffIcon} />,
    title: "Project-Based Experience",
    text: "Projects are at the centre of the learning journey — they let students demonstrate what they understand.",
  },
  {
    icon: <TrendingUp size={20} className={styles.diffIcon} />,
    title: "Structured Learning",
    text: "Clear learning paths help students understand what to learn, practice, and build next.",
  },
  {
    icon: <Star size={20} className={styles.diffIcon} />,
    title: "Guidance & Feedback",
    text: "Learning becomes more effective when students can identify mistakes, ask questions, and improve.",
  },
  {
    icon: <FileCode2 size={20} className={styles.diffIcon} />,
    title: "Portfolio Focus",
    text: "We encourage students to build work that becomes part of their professional portfolio.",
  },
  {
    icon: <CheckCircle size={20} className={styles.diffIcon} />,
    title: "Career Readiness",
    text: "Experiences designed to help students develop the practical foundation for their next opportunity.",
  },
];

const audience = [
  { emoji: "🎓", title: "College students exploring technology" },
  { emoji: "🌱", title: "Beginners starting their first technical skill" },
  { emoji: "📚", title: "Learners strengthening existing knowledge" },
  { emoji: "🛠️", title: "Students seeking project experience" },
  { emoji: "💼", title: "Students preparing for internships" },
  { emoji: "🗂️", title: "Learners building a professional portfolio" },
  { emoji: "🔭", title: "Explorers trying a new technology path" },
  { emoji: "🚀", title: "Anyone ready to learn by doing" },
];

const commitments = [
  {
    title: "Practical",
    text: "Focused on applying knowledge through real tasks and projects.",
  },
  {
    title: "Structured",
    text: "Designed with a clear path from learning to completion.",
  },
  {
    title: "Accessible",
    text: "Created to support students at different stages of their journey.",
  },
  {
    title: "Transparent",
    text: "Clear about what students will learn, build, and receive.",
  },
  {
    title: "Growth-Oriented",
    text: "Focused on continuous improvement rather than completing a checklist.",
  },
  {
    title: "Student-Centered",
    text: "Designed around helping students gain confidence and practical ability.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroBadge}>
              <span className={styles.heroDot} />
              About SkillInf
            </div>
            <h1 className={styles.heroTitle}>
              Learn Skills. Build Projects.<br />
              <span className={styles.heroHighlight}>Become Career Ready.</span>
            </h1>
            <p className={styles.heroSub}>
              SkillInf is a practical learning and career-development platform designed to help
              students turn what they learn into skills they can actually demonstrate.
            </p>
          </div>
        </section>

        {/* ── What is SkillInf / Mission + Vision ── */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.label}>Who We Are</span>
              <h2 className={styles.sectionTitle}>Our Mission &amp; Vision</h2>
              <p className={styles.sectionSub}>
                We believe learning should go beyond watching tutorials, completing assignments, and collecting
                certificates. Students need to <strong>learn, practice, build, receive feedback, and showcase</strong> their work.
              </p>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.mvCard}>
                <div className={styles.mvIconWrap}>
                  <Target size={26} className={styles.mvIcon} />
                </div>
                <h3 className={styles.mvTitle}>Our Mission</h3>
                <p className={styles.mvText}>
                  Make practical learning accessible to every student. We want students to have an environment where they
                  can learn the fundamentals, practice what they learn, build meaningful projects, improve through
                  guidance, and showcase their work confidently.
                </p>
              </div>
              <div className={styles.mvCard}>
                <div className={styles.mvIconWrap}>
                  <Eye size={26} className={styles.mvIcon} />
                </div>
                <h3 className={styles.mvTitle}>Our Vision</h3>
                <p className={styles.mvText}>
                  A future where students learn by building — and don't have to wait until their first job to gain
                  practical experience. Through structured paths, hands-on projects, internships, and portfolio-focused
                  experiences, SkillInf helps students move from <em>learning</em> to <em>doing</em>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How We Help ── */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.label}>Our Philosophy</span>
              <h2 className={styles.sectionTitle}>How We Help Students</h2>
              <p className={styles.sectionSub}>
                The outcome isn't just completing a program — the outcome is being able to show what you can do.
              </p>
            </div>

            <div className={styles.stepsGrid}>
              {howWeHelp.map((step, i) => (
                <div key={i} className={styles.stepCard}>
                  <div className={styles.stepNumber}>{i + 1}</div>
                  <div className={styles.stepIconWrap}>{step.icon}</div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What We Offer ── */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.label}>What We Offer</span>
              <h2 className={styles.sectionTitle}>Three Ways to Learn &amp; Grow</h2>
              <p className={styles.sectionSub}>
                Whether you're starting out or ready to go deeper, SkillInf gives you the structure and support to
                learn progressively and work on meaningful projects.
              </p>
            </div>

            <div className={styles.offerGrid}>
              {offers.map((offer) => (
                <div key={offer.title} className={styles.offerCard}>
                  <div className={styles.offerIconWrap}>{offer.icon}</div>
                  <h3 className={styles.offerTitle}>{offer.title}</h3>
                  <p className={styles.offerText}>{offer.text}</p>
                  <Link href={offer.href} className={styles.offerLink}>
                    {offer.cta} <ArrowRight size={15} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What Makes Us Different ── */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.label}>Why SkillInf</span>
              <h2 className={styles.sectionTitle}>What Makes Us Different</h2>
              <p className={styles.sectionSub}>
                Instead of focusing only on course completion, we focus on the journey from learning to practical
                application.
              </p>
            </div>

            <div className={styles.diffGrid}>
              {differentiators.map((d) => (
                <div key={d.title} className={styles.diffCard}>
                  <div className={styles.diffIconWrap}>{d.icon}</div>
                  <div>
                    <h3 className={styles.diffTitle}>{d.title}</h3>
                    <p className={styles.diffText}>{d.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who Can Learn ── */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.label}>For Every Learner</span>
              <h2 className={styles.sectionTitle}>Who Can Learn With SkillInf?</h2>
              <p className={styles.sectionSub}>
                SkillInf is designed for learners at different stages of their journey. There is always an opportunity
                to learn, practice, and build.
              </p>
            </div>

            <div className={styles.audienceGrid}>
              {audience.map((a) => (
                <div key={a.title} className={styles.audienceCard}>
                  <div className={styles.audienceEmoji}>{a.emoji}</div>
                  <p className={styles.audienceTitle}>{a.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Our Commitment ── */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.label}>Our Promise</span>
              <h2 className={styles.sectionTitle}>Our Commitment to Students</h2>
              <p className={styles.sectionSub}>
                We are committed to creating learning experiences that help students gain confidence and practical
                ability.
              </p>
            </div>

            <div className={styles.commitList}>
              {commitments.map((c) => (
                <div key={c.title} className={styles.commitItem}>
                  <span className={styles.commitDot} />
                  <div>
                    <p className={styles.commitTitle}>{c.title}</p>
                    <p className={styles.commitText}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.cta}>
          <div className="container">
            <h2 className={styles.ctaTitle}>Build Your Next Step With SkillInf</h2>
            <p className={styles.ctaSub}>
              Start with a skill. Turn it into practice. Turn practice into a project. Turn projects into
              opportunities.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/sign-up" className={styles.ctaPrimary} id="about-cta-internships">
                Explore Internships
              </Link>
              <Link href="/programs" className={styles.ctaSecondary} id="about-cta-programs">
                Explore Programs
              </Link>
              <Link href="/projects" className={styles.ctaSecondary} id="about-cta-projects">
                Explore Projects
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
