import type { Metadata } from "next";
import PageClient from "./page-client";

const BASE_URL = "https://www.skillinf.in";

export const metadata: Metadata = {
  title: "Website Development Services — Landing Pages to SaaS Platforms",
  description:
    "Skillinf builds fast, secure, and beautiful websites tailored for your business. From simple landing pages to full-stack SaaS platforms using React and Next.js. Transparent pricing, delivered on time.",
  keywords: [
    "custom website development India",
    "React Next.js development",
    "SaaS website development",
    "e-commerce website India",
    "landing page development",
    "business website India",
    "SEO-optimized website",
    "full stack web development",
    "website development company India",
    "responsive web design",
  ],
  alternates: {
    canonical: `${BASE_URL}/services/website`,
  },
  openGraph: {
    title: "Website Development Services | Skillinf",
    description:
      "Custom website development from landing pages to SaaS platforms. Fast, secure, and SEO-ready websites built with React & Next.js by Skillinf.",
    url: `${BASE_URL}/services/website`,
    type: "website",
    locale: "en_IN",
    siteName: "Skillinf",
    images: [
      {
        url: `${BASE_URL}/og-services-website.png`,
        width: 1200,
        height: 630,
        alt: "Website Development Services by Skillinf",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Development Services | Skillinf",
    description:
      "Custom website development from landing pages to SaaS platforms. Fast, secure, and SEO-ready — built with React & Next.js.",
    images: [`${BASE_URL}/og-services-website.png`],
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Website Development",
  provider: {
    "@type": "Organization",
    name: "Skillinf",
    url: BASE_URL,
    telephone: "+919489922054",
  },
  serviceType: "Web Development",
  description:
    "Custom website development services from landing pages to complex SaaS platforms. Built with React, Next.js, and modern web technologies. Includes SEO optimization, mobile responsiveness, and performance tuning.",
  url: `${BASE_URL}/services/website`,
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Website Development Plans",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Basic Website",
        description: "5-page responsive website with contact form and basic SEO.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Business Website",
        description:
          "Up to 15 pages with blog, CMS, advanced SEO, and analytics integration.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Premium Website",
        description:
          "Full-stack web app, custom dashboards, payment gateway integration.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Enterprise Website",
        description:
          "Multi-tenant SaaS platform, custom APIs, scalable infrastructure.",
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
    { "@type": "ListItem", position: 3, name: "Website Development", item: `${BASE_URL}/services/website` },
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
