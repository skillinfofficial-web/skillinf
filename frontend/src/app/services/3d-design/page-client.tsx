"use client";

import { motion } from "framer-motion";
import { FaCheckCircle, FaWhatsapp, FaCube } from "react-icons/fa";

const designServices = [
  "3D Architectural Visualization", "Building Exterior Rendering", "Interior 3D Design",
  "Floor Plan 3D Modeling", "Construction Site 3D", "Real Estate 3D Tours",
  "Structural 3D Modeling", "Landscape 3D Design", "Urban Planning 3D",
  "Product 3D Modeling", "Packaging 3D Design", "Industrial Product Rendering",
  "Jewelry 3D Design", "Furniture 3D Design", "Consumer Electronics Modeling",
  "Automotive 3D Rendering", "Medical Device 3D", "Fashion & Apparel 3D",
  "3D Animation", "Motion Graphics", "3D Logo Design",
  "Game Asset 3D Modeling", "Character 3D Design", "VR/AR 3D Assets",
  "360° 3D Panorama", "3D Infographics", "Technical 3D Illustrations",
];

const pricingPlans = [
  {
    name: "Basic 3D",
    priceInr: "4,999",
    priceUsd: "60",
    originalInr: "9,999",
    originalUsd: "119",
    timeline: "3-5 Days",
    support: "2 Revision Rounds",
    deliverables: "High-Res Renders",
    features: [
      "1 Static 3D Model/Scene",
      "Up to 3 Camera Angles",
      "Basic Lighting & Textures",
      "PNG / JPEG Output",
    ],
  },
  {
    name: "Professional 3D",
    priceInr: "18,999",
    priceUsd: "227",
    originalInr: "29,999",
    originalUsd: "359",
    timeline: "1-2 Weeks",
    support: "4 Revision Rounds",
    deliverables: "Renders + Source Files",
    features: [
      "Up to 5 Scenes / Models",
      "Photorealistic Rendering",
      "Advanced Lighting Setup",
      "Multiple Formats (OBJ, FBX, STL)",
      "360° View Option",
    ],
    popular: true,
  },
  {
    name: "Premium 3D Suite",
    priceInr: "44,999",
    priceUsd: "539",
    originalInr: "64,999",
    originalUsd: "779",
    timeline: "2-5 Weeks",
    support: "Unlimited Revisions",
    deliverables: "Full 3D Package",
    features: [
      "Unlimited Scenes",
      "3D Animation (up to 60 sec)",
      "VR/AR Ready Assets",
      "Walkthrough Videos",
      "All Source Files Included",
    ],
  },
  {
    name: "Enterprise 3D",
    priceInr: "Custom Quote",
    priceUsd: "Custom Quote",
    timeline: "Custom",
    support: "Dedicated 3D Team",
    deliverables: "Full Package",
    features: [
      "Full Project 3D Modeling",
      "Architectural Walkthroughs",
      "Product Line Visualizations",
      "Game-Ready Assets at Scale",
      "Ongoing 3D Retainer",
    ],
  },
];

const WA_NUMBER = "919489922054";

function buildWaUrl(planName: string) {
  const msg = [
    'Hi skillinf Team! \uD83D\uDC4B\n\n',
    "I'm interested in your *3D Design* service.\n",
    '*Selected Plan:* ' + planName + '\n\n',
    'Could you please share the exact pricing and further details?\n',
    'Looking forward to hearing from you!'
  ].join('');
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

export default function ThreeDDesign() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Professional 3D Design & Rendering Services",
            provider: {
              "@type": "Organization",
              name: "skillinf",
              url: "https://www.skillinf.in",
            },
            description:
              "Photorealistic 3D designs for architecture, construction, products, and everything in between — from floor plans to full animated walkthroughs.",
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
            Stunning <span className="services-gradient-text">3D Design</span> Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="services-subtitle"
          >
            From architectural visualizations and construction renders to product modeling and full 3D animations — we bring any idea to life in stunning photorealistic 3D.
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="services-section">
          <h2 className="services-section-title">Everything We Design in 3D</h2>
          <div className="services-grid">
            {designServices.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.02 }}
                className="service-chip service-chip--accent"
              >
                <FaCube className="service-chip-icon accent" />
                <span>{service}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="services-pricing">
          <h2 className="services-pricing-title">3D Design Pricing</h2>
          <p className="services-pricing-subtitle">
            Estimated pricing — final cost depends on scene complexity, polygon count, and animation length
          </p>
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
                {plan.popular && <div className="pricing-badge pricing-badge--accent">Most Popular</div>}
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
                  <div className="pricing-meta-row"><span>Revisions</span><span>{plan.support}</span></div>
                  <div className="pricing-meta-row pricing-meta-divider"><span>Deliverables</span><span>{plan.deliverables}</span></div>
                  <ul className="pricing-features">
                    {plan.features.map((f, fi) => (
                      <li key={fi}><FaCheckCircle className="pricing-feature-icon pricing-feature-icon--accent" size={14} />{f}</li>
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

