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

      {/* SEO: services overview text */}
      <div style={{ padding: '32px 24px 0', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--main-text)' }}>
          Digital Services by Skillinf
        </h2>
        <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '12px' }}>
          Skillinf is a full-service digital agency offering website development, AI automation, UI/UX design, and 3D design services to startups, SMEs, and enterprises across India and globally. Our team of experienced designers, developers, and AI specialists deliver premium digital solutions tailored to your business goals.
        </p>
        <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75, marginBottom: '12px' }}>
          Whether you need a high-converting landing page, a scalable SaaS platform, an AI-powered automation workflow, or pixel-perfect brand design, Skillinf has the expertise to bring your vision to life. We work with clients across diverse industries including e-commerce, education, healthcare, real estate, and technology.
        </p>
        <p style={{ color: 'var(--secondary-text)', lineHeight: 1.75 }}>
          Every project we take on is built with performance, scalability, and user experience at its core. Our transparent pricing, fast turnaround, and dedicated project support make Skillinf the preferred digital partner for businesses looking to grow online. Explore our individual service pages to view detailed pricing packages and deliverables.
        </p>
      </div>
    </div>
  );
}
