import { ArrowRight } from "lucide-react";
import styles from "./HowItWorksSection.module.css";

const steps = [
  { num: "01", title: "Explore", desc: "Browse our internship and skill-development programs and find the track that matches your interests." },
  { num: "02", title: "Apply", desc: "Complete a simple application with your basic details, education, skills, and career interests." },
  { num: "03", title: "Learn", desc: "Follow the structured learning path and develop the technical skills required for your chosen track." },
  { num: "04", title: "Build", desc: "Work on practical projects that help you apply your knowledge and develop problem-solving skills." },
  { num: "05", title: "Get Feedback", desc: "Improve your work through reviews, guidance, and feedback throughout the project journey." },
  { num: "06", title: "Showcase", desc: "Complete your program, receive credentials, and showcase your projects in your portfolio." }
];

export default function HowItWorksSection() {
  return (
    <section className={`section ${styles.howItWorksSection}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>How It Works</h2>
          <p className={styles.subtitle}>
            Getting started is simple. Choose a learning path that matches your goals and follow a structured journey from application to project completion.
          </p>
        </div>

        <div className={styles.grid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.stepNum}>{step.num}</span>
                {index % 3 !== 2 && index !== steps.length - 1 && (
                  <ArrowRight className={styles.arrowIcon} size={24} />
                )}
              </div>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
