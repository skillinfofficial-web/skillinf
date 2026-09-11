import { Wrench, Layers, FileCode2, Target, Award, Rocket } from "lucide-react";
import styles from "./AchieveSection.module.css";

const achievements = [
  {
    title: "Build Practical Skills",
    description: "Develop hands-on technical skills through structured learning and practical activities.",
    icon: <Wrench size={24} className={styles.icon} />
  },
  {
    title: "Work on Real Projects",
    description: "Apply your knowledge to projects inspired by real-world problems and industry use cases.",
    icon: <Layers size={24} className={styles.icon} />
  },
  {
    title: "Create Your Portfolio",
    description: "Build projects that can be showcased on your resume, GitHub, LinkedIn, and portfolio.",
    icon: <FileCode2 size={24} className={styles.icon} />
  },
  {
    title: "Develop Problem-Solving",
    description: "Learn how to approach problems, choose the right tools, and build robust solutions.",
    icon: <Target size={24} className={styles.icon} />
  },
  {
    title: "Gain Professional Confidence",
    description: "Get experience working through project requirements, reviews, and deadlines.",
    icon: <Award size={24} className={styles.icon} />
  },
  {
    title: "Become Career Ready",
    description: "Develop the technical foundation needed for internships, jobs, and further learning.",
    icon: <Rocket size={24} className={styles.icon} />
  }
];

export default function AchieveSection() {
  return (
    <section className={`section ${styles.achieveSection}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>What We Help You Achieve</h2>
          <p className={styles.subtitle}>
            Learning should go beyond watching tutorials and completing assignments. We help students turn what they learn into something they can actually demonstrate.
          </p>
        </div>

        <div className={styles.grid}>
          {achievements.map((item, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                {item.icon}
              </div>
              <div className={styles.content}>
                <h3 className={styles.featureTitle}>{item.title}</h3>
                <p className={styles.featureDescription}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
