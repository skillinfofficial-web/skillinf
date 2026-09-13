import Link from "next/link";
import { Bot, Code2, Database } from "lucide-react";
import styles from "./InternshipsSection.module.css";

const internships = [
  {
    id: 1,
    title: "AI & Machine Learning",
    description: "Build practical AI/ML projects and strengthen your technical foundation with real datasets.",
    icon: <Bot size={32} className={styles.icon} />,
    duration: "8 Weeks",
    level: "Beginner Friendly",
  },
  {
    id: 2,
    title: "Full-Stack Development",
    description: "Learn modern web frameworks to design, build, and deploy robust web applications from scratch.",
    icon: <Code2 size={32} className={styles.icon} />,
    duration: "10 Weeks",
    level: "Intermediate",
  },
  {
    id: 3,
    title: "Data Science & Analytics",
    description: "Master data manipulation, visualization, and statistical analysis to drive business decisions.",
    icon: <Database size={32} className={styles.icon} />,
    duration: "8 Weeks",
    level: "Beginner Friendly",
  }
];

export default function InternshipsSection() {
  return (
    <section id="internships" className={`section ${styles.internshipsSection}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Explore Our Internships</h2>
          <p className={styles.subtitle}>
            Gain practical experience by working through structured, project-based internship programs.
          </p>
        </div>

        <div className="grid-cards">
          {internships.map((internship) => (
            <div key={internship.id} className="card">
              <div className={styles.iconWrapper}>
                {internship.icon}
              </div>
              <h3 className={styles.cardTitle}>{internship.title}</h3>
              <p className={styles.cardDescription}>{internship.description}</p>
              
              <div className={styles.meta}>
                <span className={styles.metaItem}>{internship.duration}</span>
                <span className={styles.metaDot}>&middot;</span>
                <span className={styles.metaItem}>{internship.level}</span>
              </div>
              
              <Link href="/sign-up" className={styles.cardLink}>
                View Internship &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
