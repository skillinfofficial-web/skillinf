import styles from "./MethodologySection.module.css";

const steps = [
  {
    num: "01",
    title: "Learn",
    description: "Start with the fundamentals and understand the concepts, tools, and technologies."
  },
  {
    num: "02",
    title: "Practice",
    description: "Strengthen your understanding through exercises, guided tasks, and smaller challenges."
  },
  {
    num: "03",
    title: "Build",
    description: "Apply what you've learned by working on structured projects based on real scenarios."
  },
  {
    num: "04",
    title: "Review & Improve",
    description: "Receive guidance and feedback to identify gaps and understand better practices."
  },
  {
    num: "05",
    title: "Showcase",
    description: "Document your work and prepare your completed projects to be presented."
  }
];

export default function MethodologySection() {
  return (
    <section className={`section ${styles.methodologySection}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Our Methodology &mdash; How You Achieve It</h2>
          <p className={styles.subtitle}>
            Our methodology is built around learning by doing. Instead of focusing only on theory, we guide students through a practical journey where every stage contributes to a real outcome.
          </p>
        </div>

        <div className={styles.timeline}>
          {steps.map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.stepIndicator}>
                <div className={styles.stepNum}>{step.num}</div>
                {index < steps.length - 1 && <div className={styles.stepLine}></div>}
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.footer}>
          <p>The goal isn&apos;t simply to finish a program. It&apos;s to finish with something you can demonstrate.</p>
        </div>
      </div>
    </section>
  );
}
