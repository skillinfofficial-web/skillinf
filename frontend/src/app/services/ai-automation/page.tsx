import type { Metadata } from "next";
import Script from "next/script";
import PageClient from "./page-client";

const BASE_URL = "https://www.skillinf.in";

export const metadata: Metadata = {
  title: "AI Automation Services — Custom AI Agents & Workflow Automation",
  description:
    "Save hundreds of manual hours. skillinf builds custom AI agents, chatbots, and n8n automation workflows for sales, marketing, HR, and operations teams across India.",
  keywords: [
    "AI automation services India",
    "custom AI agents",
    "n8n automation",
    "chatbot development India",
    "workflow automation",
    "AI integration services",
    "business process automation",
    "lead automation",
    "AI sales automation",
    "OpenAI API integration",
  ],
  alternates: {
    canonical: `${BASE_URL}/services/ai-automation`,
  },
  openGraph: {
    title: "AI Automation Services — Custom AI Agents & Workflows | skillinf",
    description:
      "Custom AI agents, chatbots, and workflow automation by skillinf. Automate repetitive tasks in sales, marketing, and operations. Built for Indian businesses.",
    url: `${BASE_URL}/services/ai-automation`,
    type: "website",
    locale: "en_IN",
    siteName: "skillinf",
    images: [
      {
        url: `${BASE_URL}/og-services-ai.png`,
        width: 1200,
        height: 630,
        alt: "AI Automation Services by skillinf",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Automation Services — Custom AI Agents & Workflows | skillinf",
    description:
      "Custom AI agents, chatbots, and n8n workflow automation. Save hundreds of manual hours with skillinf.",
    images: [`${BASE_URL}/og-services-ai.png`],
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Automation",
  provider: {
    "@type": "Organization",
    name: "skillinf",
    url: BASE_URL,
    telephone: "+919489922054",
  },
  serviceType: "AI Automation & Chatbot Development",
  description:
    "Custom AI automation solutions including AI agents, chatbots, and n8n workflow automation to eliminate repetitive work and scale operations for sales, marketing, HR, and customer support teams.",
  url: `${BASE_URL}/services/ai-automation`,
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "AI Automation Plans",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Starter Automation",
        description:
          "1 automation workflow, basic chatbot or lead capture bot, up to 1000 tasks/month.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Growth Automation",
        description:
          "Up to 5 workflows, AI chatbot with custom training, CRM integration.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Pro Automation",
        description:
          "Unlimited workflows, AI agents for sales & support, advanced integrations.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Enterprise AI",
        description:
          "Custom LLM fine-tuning, multi-agent systems, dedicated support, on-premise deployment.",
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
    { "@type": "ListItem", position: 3, name: "AI Automation", item: `${BASE_URL}/services/ai-automation` },
  ],
};

export default function Page() {
  return (
    <>
      <Script
        id="ai-automation-service-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        strategy="beforeInteractive"
      />
      <Script
        id="ai-automation-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        strategy="beforeInteractive"
      />
      <PageClient />
    </>
  );
}
