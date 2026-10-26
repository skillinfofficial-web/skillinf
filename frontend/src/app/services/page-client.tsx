"use client";

import Link from "next/link";

const services = [
  {
    title: "Website Services",
    desc: "From landing pages to enterprise SaaS — fast, secure, and beautiful websites.",
    href: "/services/website",
  },
  {
    title: "AI Automation",
    desc: "Custom AI agents and workflows that automate your sales, marketing, and operations.",
    href: "/services/ai-automation",
  },
  {
    title: "UI/UX Design",
    desc: "Pixel-perfect, intuitive designs for websites, apps, dashboards, and SaaS products.",
    href: "/services/ui-ux-design",
  },
  {
    title: "3D Design",
    desc: "Photorealistic 3D for architecture, construction, products, animations and more.",
    href: "/services/3d-design",
  },
];

export default function ServicesHomeClient() {
  return (
    <div className="services-overview-page">
      <div className="services-hero">
        <h1 className="services-title svc-fade-up">
          All Our <span className="services-gradient-text">Services</span>
        </h1>
        <p className="services-subtitle svc-fade-up svc-delay-1">
          Premium digital services by Skillinf to take your business to the next level — all in one place.
        </p>
      </div>
      <div className="services-overview-grid">
        {services.map((service, idx) => (
          <div
            key={service.href}
            className="svc-fade-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <Link href={service.href} className="services-overview-card">
              <h2 className="services-overview-card-title">{service.title}</h2>
              <p className="services-overview-card-desc">{service.desc}</p>
              <span className="services-overview-arrow">View Pricing &amp; Details →</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
