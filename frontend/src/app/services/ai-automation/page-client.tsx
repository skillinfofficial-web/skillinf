"use client";

import { Bot } from "lucide-react";

const WA_ICON = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.532 5.856L.057 23.999l6.305-1.654A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.015-1.381l-.36-.214-3.733.979 1.001-3.64-.234-.374A9.818 9.818 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/>
  </svg>
);

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
    `Hi Skillinf Team! \uD83D\uDC4B\n\n` +
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
      <div className="services-page-container">
        <div className="services-hero">
          <h1 className="services-title svc-fade-up">
            Intelligent <span className="services-gradient-text">AI Automation</span>
          </h1>
          <p className="services-subtitle svc-fade-up svc-delay-1">
            Save hundreds of manual hours every month. We build custom AI agents and workflows that automate your sales, marketing, and operations.
          </p>
        </div>

        {/* Services Grid */}
        <div className="services-section">
          <h2 className="services-section-title">Capabilities &amp; Integrations</h2>
          <div className="services-grid">
            {automationServices.map((service, idx) => (
              <div
                key={idx}
                className="service-chip service-chip--accent svc-fade-in"
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                <Bot size={14} className="service-chip-icon accent" />
                <span>{service}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="services-pricing">
          <h2 className="services-pricing-title">Investment &amp; ROI</h2>
          <div className="pricing-grid">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`pricing-card svc-fade-up${plan.popular ? " pricing-card--popular pricing-card--accent-pop" : ""}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {plan.popular && <div className="pricing-badge pricing-badge--accent">Recommended</div>}
                <h3 className="pricing-plan-name">{plan.name}</h3>
                <div className="pricing-from">Starting from</div>
                {plan.originalInr && (
                  <div className="pricing-original">
                    <span className="pricing-strike">₹{plan.originalInr} / ${plan.originalUsd}</span>
                    <span className="pricing-offer-badge pricing-offer-badge--accent pricing-pulse">Special Offer</span>
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
                  <WA_ICON />
                  Know Exact Pricing
                </a>
              </div>
            ))}
          </div>
          <div className="pricing-disclaimer pricing-disclaimer--accent svc-fade-up">
            <span className="pricing-disclaimer-label pricing-disclaimer-label--accent">Note:</span>
            Prices may vary based on your requirements. For the exact price, contact Skillinf via WhatsApp.
          </div>
        </div>
      </div>
    </>
  );
}
