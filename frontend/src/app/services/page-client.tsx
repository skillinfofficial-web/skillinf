"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const services = [
  {
    emoji: "🌐",
    title: "Website Services",
    desc: "From landing pages to enterprise SaaS — fast, secure, and beautiful websites.",
    href: "/services/website",
  },
  {
    emoji: "🤖",
    title: "AI Automation",
    desc: "Custom AI agents and workflows that automate your sales, marketing, and operations.",
    href: "/services/ai-automation",
  },
  {
    emoji: "🎨",
    title: "UI/UX Design",
    desc: "Pixel-perfect, intuitive designs for websites, apps, dashboards, and SaaS products.",
    href: "/services/ui-ux-design",
  },
  {
    emoji: "🧊",
    title: "3D Design",
    desc: "Photorealistic 3D for architecture, construction, products, animations and more.",
    href: "/services/3d-design",
  },
];

export default function ServicesHomeClient() {
  return (
    <div className="services-overview-page">
      <div className="services-hero">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="services-title"
        >
          All Our <span className="services-gradient-text">Services</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="services-subtitle"
        >
          Premium digital services by skillinf to take your business to the next level — all in one place.
        </motion.p>
      </div>
      <div className="services-overview-grid">
        {services.map((service, idx) => (
          <motion.div
            key={service.href}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link href={service.href} className="services-overview-card">
              <span className="services-overview-emoji">{service.emoji}</span>
              <h2 className="services-overview-card-title">{service.title}</h2>
              <p className="services-overview-card-desc">{service.desc}</p>
              <span className="services-overview-arrow">View Pricing &amp; Details →</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
