import { BookOpen, Briefcase, GraduationCap, Compass, FolderKanban, TrendingUp } from "lucide-react";
import styles from "./WhyChooseUsSection.module.css";

const reasons = [
  { icon: <BookOpen size={28} />, title: "Practical Learning", desc: "Move beyond theory with hands-on activities." },
  { icon: <Briefcase size={28} />, title: "Real-World Projects", desc: "Work on projects designed around practical industry problems." },
  { icon: <Compass size={28} />, title: "Structured Learning", desc: "Follow a clear learning journey from start to finish." },
  { icon: <GraduationCap size={28} />, title: "Guidance & Feedback", desc: "Get support throughout your project journey to improve." },
  { icon: <FolderKanban size={28} />, title: "Portfolio Focused", desc: "Build projects that give you something meaningful to showcase." },
  { icon: <TrendingUp size={28} />, title: "Career Ready", desc: "Develop technical skills that support your next career step." }
];

export default function WhyChooseUsSection() {
  return (
    <section className={`section ${styles.whyChooseUsSection}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Why Students Choose Us</h2>
          <p className={styles.subtitle}>
            Students don&apos;t just need another course. They need an opportunity to understand, practice, build, and demonstrate what they know.
          </p>
        </div>

        <div className={styles.grid}>
          {reasons.map((reason, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.icon}>{reason.icon}</div>
              <h3 className={styles.cardTitle}>{reason.title}</h3>
              <p className={styles.cardDesc}>{reason.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
