import Link from "next/link";
import { ExternalLink } from "lucide-react";
import styles from "./ProjectsSection.module.css";

const projects = [
  {
    title: "AI Resume Analyzer",
    tags: ["Python", "NLP", "AI"],
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600&h=400",
  },
  {
    title: "Recommendation System",
    tags: ["Python", "Machine Learning"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600&h=400",
  },
  {
    title: "AI Customer Support",
    tags: ["RAG", "LLM", "Automation"],
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600&h=400",
  }
];

export default function ProjectsSection() {
  return (
    <section id="projects" className={`section ${styles.projectsSection}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>What Can You Build?</h2>
          <p className={styles.subtitle}>
            A certificate shows you completed a program. A project shows what you learned. Here are examples of what you can build.
          </p>
        </div>

        <div className="grid-cards">
          {projects.map((project, index) => (
            <div key={index} className={styles.projectCard}>
              <div 
                className={styles.imagePlaceholder}
                style={{ backgroundImage: `url(${project.image})` }}
              ></div>
              <div className={styles.content}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <div className={styles.tags}>
                  {project.tags.map((tag, i) => (
                    <span key={i} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <Link href="#" className={styles.viewLink}>
                  View Project <ExternalLink size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
