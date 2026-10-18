"use client";

import { motion } from "framer-motion";
import { FaWhatsapp, FaRobot } from "react-icons/fa";

const automationServices = [
  "n8n Automation", "AI Agents", "WhatsApp Automation",
  "Email Automation", "CRM Automation", "Lead Generation Automation",
  "Google Sheets Automation", "Appointment Automation", "Invoice Automation",
  "Customer Support AI", "OpenAI Integration", "Webhook Automation",
  "API Integrations", "Workflow Optimization", "Business Process Automation",
  "Chatbot Development", "Knowledge Base AI", "Voice AI", "Document AI",
];

const pricingPlans = [
  {
    name: "Starter Automation",
    priceInr: "5,499",
    priceUsd: "66",
    originalInr: "14,999",
    originalUsd: "179",
    timeline: "1-2 Weeks",
    support: "1 Month Free",
    maintenance: "Basic Tweaks",
    features: ["Simple Workflows", "Zapier/n8n Setup", "Email/Sheets Sync", "Basic Chatbot"],
  },
  {
    name: "Business Automation",
    priceInr: "24,999",
    priceUsd: "299",
    originalInr: "34,999",
    originalUsd: "419",
    timeline: "2-4 Weeks",
    support: "3 Months Free",
    maintenance: "Priority Tweaks",
    features: ["Complex Workflows", "CRM Integration", "WhatsApp Bot Setup", "Lead Gen Automation", "Custom API Integrations"],
    popular: true,
  },
  {
    name: "Advanced AI System",
    priceInr: "54,999",
    priceUsd: "659",
    originalInr: "74,999",
    originalUsd: "899",
    timeline: "4-8 Weeks",
    support: "6 Months Free",
    maintenance: "24/7 Priority",
    features: ["Custom AI Agents", "OpenAI Integration", "Knowledge Base RAG", "Voice AI Support", "End-to-End Processes"],
  },
  {
    name: "Enterprise Automation",
    priceInr: "Custom Quote",
    priceUsd: "Custom Quote",
    timeline: "Custom",
    support: "Dedicated Engineer",
    maintenance: "Full Management",
    features: ["Custom Infrastructure", "Local LLM Deployments", "Advanced Security", "Mass Scale Automation", "Custom AI Models"],
  },
];

const WA_NUMBER = "919489922054";

function buildWaUrl(planName: string) {
  const message = encodeURIComponent(
    `Hi skillinf Team! 👋\n\n` +
    `I'm interested in your *AI Automation* service.\n` +
    `*Selected Plan:* ${planName}\n\n` +
    `Could you please share the exact pricing and further details?\n` +
    `Looking forward to hearing from you!`
  );
  return `https://wa.me/${WA_NUMBER}?text=${message}`;
}

export default function AIAutomation() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Intelligent AI Automation Services",
            provider: {
              "@type": "Organization",
              name: "skillinf",
              url: "https://www.skillinf.in",
            },
            description:
              "We build custom AI agents and workflows that automate your sales, marketing, and operations.",
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
            Intelligent <span className="services-gradient-text">AI Automation</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="services-subtitle"
          >
            Save hundreds of manual hours every month. We build custom AI agents and workflows that automate your sales, marketing, and operations.
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="services-section">
          <h2 className="services-section-title">Capabilities &amp; Integrations</h2>
          <div className="services-grid">
            {automationServices.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.02 }}
                className="service-chip service-chip--accent"
              >
                <FaRobot className="service-chip-icon accent" />
                <span>{service}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="services-pricing">
          <h2 className="services-pricing-title">Investment &amp; ROI</h2>
          <div className="pricing-grid">
            {pricingPlans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`pricing-card${plan.popular ? " pricing-card--popular pricing-card--accent-pop" : ""}`}
              >
                {plan.popular && <div className="pricing-badge pricing-badge--accent">Recommended</div>}
                <h3 className="pricing-plan-name">{plan.name}</h3>
                <div className="pricing-from">Starting from</div>
                {plan.originalInr && (
                  <div className="pricing-original">
                    <span className="pricing-strike">₹{plan.originalInr} / ${plan.originalUsd}</span>
                    <motion.span
                      animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="pricing-offer-badge pricing-offer-badge--accent"
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
                      <li key={fi}><span className="pricing-dot" />{f}</li>
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
            className="pricing-disclaimer pricing-disclaimer--accent"
          >
            <span className="pricing-disclaimer-label pricing-disclaimer-label--accent">Note:</span>
            Prices may vary based on your requirements. For the exact price, contact skillinf via WhatsApp.
          </motion.div>
        </div>
      </div>
    </>
  );
}
