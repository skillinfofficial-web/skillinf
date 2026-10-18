"use client";

import { Check, Box } from "lucide-react";

const WA_ICON = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.532 5.856L.057 23.999l6.305-1.654A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.015-1.381l-.36-.214-3.733.979 1.001-3.64-.234-.374A9.818 9.818 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/>
  </svg>
);

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
    "Hi skillinf Team! \uD83D\uDC4B\n\n",
    "I'm interested in your *3D Design* service.\n",
    "*Selected Plan:* " + planName + "\n\n",
    "Could you please share the exact pricing and further details?\n",
    "Looking forward to hearing from you!",
  ].join("");
  return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
}

export default function ThreeDDesign() {
  return (
    <>
      <div className="services-page-container">
        <div className="services-hero">
          <h1 className="services-title svc-fade-up">
            Stunning <span className="services-gradient-text">3D Design</span> Services
          </h1>
          <p className="services-subtitle svc-fade-up svc-delay-1">
            From architectural visualizations and construction renders to product modeling and full 3D animations — we bring any idea to life in stunning photorealistic 3D.
          </p>
        </div>

        {/* Services Grid */}
        <div className="services-section">
          <h2 className="services-section-title">Everything We Design in 3D</h2>
          <div className="services-grid">
            {designServices.map((service, idx) => (
              <div
                key={idx}
                className="service-chip service-chip--accent svc-fade-in"
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                <Box size={14} className="service-chip-icon accent" />
                <span>{service}</span>
              </div>
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
              <div
                key={idx}
                className={`pricing-card svc-fade-up${plan.popular ? " pricing-card--popular pricing-card--accent-pop" : ""}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {plan.popular && <div className="pricing-badge pricing-badge--accent">Most Popular</div>}
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
                  <div className="pricing-meta-row"><span>Revisions</span><span>{plan.support}</span></div>
                  <div className="pricing-meta-row pricing-meta-divider"><span>Deliverables</span><span>{plan.deliverables}</span></div>
                  <ul className="pricing-features">
                    {plan.features.map((f, fi) => (
                      <li key={fi}><Check size={14} className="pricing-feature-icon pricing-feature-icon--accent" />{f}</li>
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
            Prices may vary based on your requirements. For the exact price, contact skillinf via WhatsApp.
          </div>
        </div>
      </div>
    </>
  );
}
