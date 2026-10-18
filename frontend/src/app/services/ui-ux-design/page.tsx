import type { Metadata } from "next";
import PageClient from "./page-client";

const BASE_URL = "https://www.skillinf.in";

export const metadata: Metadata = {
  title: "UI/UX Design Services — Figma Design for Apps, Websites & SaaS",
  description:
    "Pixel-perfect, intuitive UI/UX designs by skillinf for mobile apps, web apps, dashboards, and SaaS products. User research, wireframes, prototypes, and final Figma handoffs. Loved by users.",
  keywords: [
    "UI UX design services India",
    "Figma design agency India",
    "mobile app UI design",
    "web app UX design",
    "SaaS dashboard design",
    "product design India",
    "user experience design",
    "wireframe prototyping",
    "design system creation",
    "user interface design company",
  ],
  alternates: {
    canonical: `${BASE_URL}/services/ui-ux-design`,
  },
  openGraph: {
    title: "UI/UX Design Services — Figma, Apps, SaaS & Dashboards | skillinf",
    description:
      "Pixel-perfect UI/UX designs by skillinf for apps, websites, and SaaS dashboards. User research, wireframes, prototypes, and Figma handoffs.",
    url: `${BASE_URL}/services/ui-ux-design`,
    type: "website",
    locale: "en_IN",
    siteName: "skillinf",
    images: [
      {
        url: `${BASE_URL}/og-services-uiux.png`,
        width: 1200,
        height: 630,
        alt: "UI/UX Design Services by skillinf",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UI/UX Design Services — Figma, Apps & SaaS | skillinf",
    description:
      "Pixel-perfect UI/UX designs by skillinf. Wireframes, prototypes, design systems, and Figma handoffs for apps, websites & SaaS.",
    images: [`${BASE_URL}/og-services-uiux.png`],
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "UI/UX Design",
  provider: {
    "@type": "Organization",
    name: "skillinf",
    url: BASE_URL,
    telephone: "+919489922054",
  },
  serviceType: "User Interface & User Experience Design",
  description:
    "Professional UI/UX design services including user research, wireframing, interactive prototyping, design system creation, and developer-ready Figma handoffs for mobile apps, web applications, dashboards, and SaaS products.",
  url: `${BASE_URL}/services/ui-ux-design`,
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "UI/UX Design Plans",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Landing Page Design",
        description:
          "Single-page UI design with mobile responsiveness and Figma delivery.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "App UI Design",
        description:
          "Multi-screen mobile or web app design, user flows, and interactive prototype.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Dashboard Design",
        description:
          "Complex admin/user dashboard, data visualization components, and design system.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Full Product Design",
        description:
          "End-to-end product design: research, UX strategy, wireframes, prototypes, and handoff.",
        priceCurrency: "INR",
      },
    ],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Services", item: `${BASE_URL}/services` },
    { "@type": "ListItem", position: 3, name: "UI/UX Design", item: `${BASE_URL}/services/ui-ux-design` },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PageClient />
    </>
  );
}
