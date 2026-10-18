"use client";

import { motion } from "framer-motion";
import { FaCheckCircle, FaWhatsapp, FaPaintBrush } from "react-icons/fa";

const uiuxServices = [
  "Website UI Design", "Mobile App UI Design", "Dashboard UI Design",
  "Landing Page Design", "E-Commerce UI Design", "SaaS Product Design",
  "Admin Panel Design", "Responsive Web Design", "User Flow Mapping",
  "Wireframing", "Prototyping", "Interactive Mockups",
  "Design System Creation", "Brand UI Guidelines", "Accessibility (WCAG) Design",
  "App Redesign / Revamp", "Figma Design", "Adobe XD Design",
  "User Research & Testing", "Micro-interaction Design", "Dark Mode UI",
  "Cross-Platform App Design", "Icon & Illustration Design", "Onboarding UX Design",
];

const pricingPlans = [
  {
    name: "Starter UI",
    priceInr: "3,999",
    priceUsd: "48",
    originalInr: "8,999",
    originalUsd: "107",
    timeline: "3-5 Days",
    support: "1 Revision Round",
    deliverables: "Figma File",
    features: [
      "Up to 5 Screens",
      "Mobile Responsive Design",
      "Basic Wireframes",
      "Color & Typography System",
    ],
  },
  {
    name: "Business UI/UX",
    priceInr: "12,999",
    priceUsd: "155",
    originalInr: "22,999",
    originalUsd: "275",
    timeline: "1-2 Weeks",
    support: "3 Revision Rounds",
    deliverables: "Figma + Prototype",
    features: [
      "Up to 20 Screens",
      "User Flow Diagrams",
      "Interactive Prototype",
      "Design System",
      "Mobile & Web Variants",
    ],
    popular: true,
  },
  {
    name: "Premium Product Design",
    priceInr: "29,999",
    priceUsd: "359",
    originalInr: "44,999",
    originalUsd: "539",
    timeline: "2-4 Weeks",
    support: "Unlimited Revisions",
    deliverables: "Full Design Package",
    features: [
      "Unlimited Screens",
      "Full UX Research",
      "Usability Testing",
      "Component Library",
      "Developer Handoff Assets",
    ],
  },
  {
    name: "Enterprise Design",
    priceInr: "Custom Quote",
    priceUsd: "Custom Quote",
    timeline: "Custom",
    support: "Dedicated Designer",
    deliverables: "Full Package",
    features: [
      "Multi-Platform Design",
      "Brand Design System",
      "Accessibility Audit",
      "Design Operations",
      "Ongoing Design Retainer",
    ],
  },
];

const WA_NUMBER = "919489922054";

function buildWaUrl(planName: string) {
  const message = encodeURIComponent(
    `Hi skillinf Team! \u{1F44B}\n\n` +
    `I'm interested in your *UI\/UX Design* service.\n` +
    `*Selected Plan:* ${planName}\n\n` +
    `Could you please share the exact pricing and further details?\n` +
    `Looking forward to hearing from you!`
  );
  return `https://wa.me/${WA_NUMBER}?text=${message}`;
}

export default function UIUXDesign() {

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Professional UI/UX Design Services",
            provider: {
              "@type": "Organization",
              name: "skillinf",
              url: "https://www.skillinf.in",
            },
            description:
              "We craft beautiful, intuitive UI/UX designs for websites, mobile apps, dashboards, and SaaS products that users love.",
            areaServed: "Worldwide",
          }),
        }}
      />
      <div className="services-page-container">
        <div className="services-hero">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="services-title"
          >
            Premium <span className="services-gradient-text">UI/UX Design</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="services-subtitle"
          >
            From pixel-perfect website interfaces to full mobile app experiences — we design digital products that are visually stunning, deeply intuitive, and conversion-optimized.
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="services-section">
          <h2 className="services-section-title">What We Design</h2>
          <div className="services-grid">
            {uiuxServices.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.02 }}
                className="service-chip"
              >
                <FaPaintBrush className="service-chip-icon primary" />
                <span>{service}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="services-pricing">
          <h2 className="services-pricing-title">Design Packages</h2>
          <p className="services-pricing-subtitle">
            All packages include source files (Figma), developer-ready assets &amp; mobile-responsive layouts
          </p>
          <div className="pricing-grid">
            {pricingPlans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`pricing-card${plan.popular ? " pricing-card--popular" : ""}`}
              >
                {plan.popular && <div className="pricing-badge">Most Popular</div>}
                <h3 className="pricing-plan-name">{plan.name}</h3>
                <div className="pricing-from">Starting from</div>
                {plan.originalInr && (
                  <div className="pricing-original">
                    <span className="pricing-strike">₹{plan.originalInr} / ${plan.originalUsd}</span>
                    <motion.span
                      animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="pricing-offer-badge"
                    >
                      Special Offer
                    </motion.span>
                  </div>
                )}
                <div className="pricing-price">
                  {plan.priceInr === "Custom Quote" ? (
                    "Custom"
                  ) : (
                    <span>₹{plan.priceInr} <span className="pricing-usd">/ ${plan.priceUsd}</span></span>
                  )}
                </div>
                <div className="pricing-meta">
                  <div className="pricing-meta-row"><span>Timeline</span><span>{plan.timeline}</span></div>
                  <div className="pricing-meta-row"><span>Revisions</span><span>{plan.support}</span></div>
                  <div className="pricing-meta-row pricing-meta-divider"><span>Deliverables</span><span>{plan.deliverables}</span></div>
                  <ul className="pricing-features">
                    {plan.features.map((f, fi) => (
                      <li key={fi}><FaCheckCircle className="pricing-feature-icon" />{f}</li>
                    ))}
                  </ul>
                </div>
                <a href={buildWaUrl(plan.name)} target="_blank" rel="noopener noreferrer" className="pricing-cta">
                  <FaWhatsapp size={18} className="wa-icon" />
                  Know Exact Pricing
                </a>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pricing-disclaimer"
          >
            <span className="pricing-disclaimer-label">Note:</span>
            Prices may vary based on your requirements. For the exact price, contact skillinf via WhatsApp.
          </motion.div>
        </div>
      </div>
    </>
  );
}

