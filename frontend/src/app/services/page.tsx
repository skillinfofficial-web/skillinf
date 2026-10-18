import type { Metadata } from "next";
import PageClient from "./page-client";

const BASE_URL = "https://www.skillinf.in";

export const metadata: Metadata = {
  title: "Digital Services — Website, AI, UI/UX & 3D Design",
  description:
    "skillinf offers premium digital services: custom website development, AI automation, UI/UX design, and 3D rendering. Built for startups, SMEs and enterprises in India.",
  keywords: [
    "digital services India",
    "website development India",
    "AI automation services",
    "UI UX design agency India",
    "3D design rendering India",
    "skillinf services",
    "web development company India",
    "custom software development",
  ],
  alternates: {
    canonical: `${BASE_URL}/services`,
  },
  openGraph: {
    title: "Digital Services — Website, AI, UI/UX & 3D Design | skillinf",
    description:
      "Premium digital services from skillinf: Website Development, AI Automation, UI/UX Design, and 3D Design & Rendering for businesses across India.",
    url: `${BASE_URL}/services`,
    type: "website",
    locale: "en_IN",
    siteName: "skillinf",
    images: [
      {
        url: `${BASE_URL}/og-services.png`,
        width: 1200,
        height: 630,
        alt: "skillinf Digital Services — Website, AI, UI/UX & 3D Design",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Services — Website, AI, UI/UX & 3D Design | skillinf",
    description:
      "Premium digital services from skillinf: Website Development, AI Automation, UI/UX Design, and 3D Design & Rendering.",
    images: [`${BASE_URL}/og-services.png`],
  },
};

const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "skillinf Digital Services",
  url: `${BASE_URL}/services`,
  description:
    "Premium digital services offered by skillinf including Website Development, AI Automation, UI/UX Design, and 3D Design.",
  numberOfItems: 4,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Website Development",
      url: `${BASE_URL}/services/website`,
      description:
        "Custom website development from landing pages to full SaaS platforms using React and Next.js.",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "AI Automation",
      url: `${BASE_URL}/services/ai-automation`,
      description:
        "AI agents and automation workflows to save time and reduce manual work across sales, marketing, and operations.",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "UI/UX Design",
      url: `${BASE_URL}/services/ui-ux-design`,
      description:
        "Pixel-perfect, user-centric UI/UX designs for websites, apps, dashboards, and SaaS products.",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "3D Design & Rendering",
      url: `${BASE_URL}/services/3d-design`,
      description:
        "Photorealistic 3D designs for architecture, products, and animated walkthroughs.",
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Services",
      item: `${BASE_URL}/services`,
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PageClient />
    </>
  );
}
