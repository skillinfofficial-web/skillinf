"use client";

import { motion } from "framer-motion";
import { FaCheckCircle, FaWhatsapp } from "react-icons/fa";

const servicesList = [
  "Business Websites", "Landing Pages", "Portfolio Websites",
  "Corporate Websites", "Restaurant Websites", "School Websites",
  "Hospital Websites", "Gym Websites", "Hotel Websites",
  "Real Estate Websites", "E-Commerce Stores", "SaaS Websites",
  "Blog Websites", "Website Redesign", "Website Maintenance",
  "Website Speed Optimization", "SEO Optimization", "Hosting Setup",
  "Domain Configuration", "SSL Installation", "CMS Development",
  "Admin Dashboard", "Responsive Design",
];

const pricingPlans = [
  {
    name: "Basic Website",
    priceInr: "4,499",
    priceUsd: "54",
    originalInr: "9,999",
    originalUsd: "119",
    timeline: "1-2 Weeks",
    support: "1 Month Free",
    maintenance: "Basic Updates",
    features: ["Custom Design", "Mobile Responsive", "Basic SEO", "Contact Form"],
  },
  {
    name: "Business Website",
    priceInr: "14,999",
    priceUsd: "179",
    originalInr: "24,999",
    originalUsd: "299",
    timeline: "2-4 Weeks",
    support: "3 Months Free",
    maintenance: "Priority Updates",
    features: ["Premium Design", "CMS Integration", "Advanced SEO", "Live Chat", "Analytics"],
  },
  {
    name: "Premium Website",
    priceInr: "34,999",
    priceUsd: "419",
    originalInr: "49,999",
    originalUsd: "599",
    timeline: "4-6 Weeks",
    support: "6 Months Free",
    maintenance: "24/7 Priority",
    features: ["E-commerce Ready", "Custom Dashboards", "Payment Gateway", "API Integrations", "Multi-language"],
    popular: true,
  },
  {
    name: "Enterprise",
    priceInr: "Custom Quote",
    priceUsd: "Custom Quote",
    timeline: "Custom",
    support: "Dedicated Team",
    maintenance: "Full Management",
    features: ["Custom Architecture", "Scalable Infrastructure", "Advanced Security", "Custom Web Apps", "SaaS Platform"],
  },
];

export default function WebsiteServices() {
  const WA_NUMBER = "919489922054";

  function buildWaUrl(planName: string) {
    const message = encodeURIComponent(
      `Hi skillinf Team! 👋\n\n` +
      `I'm interested in your *Website Services*.\n` +
      `*Selected Plan:* ${planName}\n\n` +
      `Could you please share the exact pricing and further details?\n` +
      `Looking forward to hearing from you!`
    );
    return `https://wa.me/${WA_NUMBER}?text=${message}`;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Premium Website Development Services",
            provider: {
              "@type": "Organization",
              name: "skillinf",
              url: "https://www.skillinf.in",
            },
            description:
              "From landing pages to complex SaaS platforms, we build fast, secure, and beautiful websites tailored to your business needs.",
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
            Premium <span className="services-gradient-text">Website Services</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="services-subtitle"
          >
            From simple landing pages to complex enterprise SaaS platforms, we build fast, secure, and beautiful websites tailored to your business needs.
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="services-section">
          <h2 className="services-section-title">What We Build &amp; Optimize</h2>
          <div className="services-grid">
            {servicesList.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.02 }}
                className="service-chip"
              >
                <FaCheckCircle className="service-chip-icon primary" />
                <span>{service}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="services-pricing">
          <h2 className="services-pricing-title">Transparent Pricing</h2>
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
                  <div className="pricing-meta-row"><span>Support</span><span>{plan.support}</span></div>
                  <div className="pricing-meta-row pricing-meta-divider"><span>Maintenance</span><span>{plan.maintenance}</span></div>
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
