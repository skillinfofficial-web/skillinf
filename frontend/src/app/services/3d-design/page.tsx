import type { Metadata } from "next";
import PageClient from "./page-client";

const BASE_URL = "https://www.skillinf.in";

export const metadata: Metadata = {
  title: "3D Design & Rendering Services — Architecture, Products & Animations",
  description:
    "Photorealistic 3D designs by Skillinf for architecture visualization, product modeling, and animated walkthroughs. From floor plans and elevations to full cinematic 3D animations — delivered in 4K.",
  keywords: [
    "3D design services India",
    "architectural visualization India",
    "3D rendering services",
    "product 3D modeling",
    "3D animation India",
    "CGI rendering India",
    "floor plan 3D visualization",
    "interior design 3D rendering",
    "exterior 3D visualization",
    "real estate 3D rendering",
  ],
  alternates: {
    canonical: `${BASE_URL}/services/3d-design`,
  },
  openGraph: {
    title: "3D Design & Rendering Services — Architecture, Products & Animations | Skillinf",
    description:
      "Photorealistic 3D visualizations by Skillinf for architecture, products, and animations. Floor plans to full cinematic 3D walkthroughs delivered in 4K.",
    url: `${BASE_URL}/services/3d-design`,
    type: "website",
    locale: "en_IN",
    siteName: "Skillinf",
    images: [
      {
        url: `${BASE_URL}/og-services-3d.png`,
        width: 1200,
        height: 630,
        alt: "3D Design & Rendering Services by Skillinf",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D Design & Rendering Services | Skillinf",
    description:
      "Photorealistic 3D designs for architecture, products, and animations. From floor plans to 4K cinematic walkthroughs by Skillinf.",
    images: [`${BASE_URL}/og-services-3d.png`],
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "3D Design & Rendering",
  provider: {
    "@type": "Organization",
    name: "Skillinf",
    url: BASE_URL,
    telephone: "+919489922054",
  },
  serviceType: "3D Design, Modeling & Architectural Visualization",
  description:
    "Professional 3D design and rendering services including architectural visualization, product modeling, interior and exterior 3D renders, and full animated 3D walkthroughs delivered in high resolution for real estate, product launches, and marketing.",
  url: `${BASE_URL}/services/3d-design`,
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "3D Design Plans",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Basic 3D",
        description:
          "Up to 3 still renders (interior or exterior) in Full HD resolution.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Standard 3D",
        description:
          "Up to 10 still renders plus 360° virtual tour, 4K resolution.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Premium 3D",
        description:
          "Full 3D model with unlimited renders, 60-second animation walkthrough in 4K.",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Enterprise 3D",
        description:
          "Complete project visualization package, cinematic video, VR-ready assets, and revisions.",
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
    { "@type": "ListItem", position: 3, name: "3D Design & Rendering", item: `${BASE_URL}/services/3d-design` },
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
