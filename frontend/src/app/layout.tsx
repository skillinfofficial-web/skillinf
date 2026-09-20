import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import FloatingChat from "@/components/shared/FloatingChat";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-inter",
});

const BASE_URL = "https://www.skillinf.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "skillinf | Free Virtual Internships for Students",
    template: "%s | skillinf",
  },
  description:
    "Free virtual internships in AI, Web Development & Data Science. Build real projects, earn a certificate, and become career-ready — all online.",
  keywords: [
    "free virtual internship",
    "student internship online",
    "AI internship",
    "web development internship",
    "data science internship",
    "internship certificate",
    "practical skills for students",
    "career ready",
    "machine learning internship",
    "online training program",
    "skillinf",
  ],
  authors: [{ name: "skillinf", url: BASE_URL }],
  creator: "skillinf",
  publisher: "skillinf",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "ZwHE0BZ4yK_XWEg8hZuU7-_C9wjxyPrrj0GZfsBFHZM",
  },
  alternates: {
    canonical: BASE_URL + "/",
  },
  /* ── Favicon / Icons ─────────────────────────────────────────────── */
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "skillinf | Free Virtual Internships for Students",
    description:
      "Gain real project experience, build a portfolio, and earn a verified certificate through skillinf's virtual internship programs.",
    url: BASE_URL + "/",
    type: "website",
    locale: "en_US",
    siteName: "skillinf",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "skillinf — Free Virtual Internships for Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "skillinf | Free Virtual Internships for Students",
    description:
      "Free virtual internships in AI, Web Dev & Data Science. Build projects, earn certificates, and become career-ready.",
    images: [`${BASE_URL}/og-image.png`],
  },
};

/* ── Structured Data (JSON-LD) ─────────────────────────────────────── */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "skillinf",
  url: BASE_URL,
  logo: `${BASE_URL}/skillinf-logo.png`,
  description:
    "skillinf helps students turn academic knowledge into practical, career-ready skills through free virtual internship programs.",
  email: "support@skillinf.in",
  telephone: "+919342637290",
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
    addressRegion: "Remote",
  },
  sameAs: [
    "https://www.linkedin.com/company/skillinf-official/",
    "https://www.instagram.com/skillinfofficial/",
  ],
  knowsAbout: [
    "Artificial Intelligence",
    "Machine Learning",
    "Web Development",
    "Data Science",
    "Cybersecurity",
    "Student Internships",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "skillinf",
  url: BASE_URL,
  description:
    "Free virtual internship programs for students in AI, Web Development, Data Science, and more.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/internships?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const educationProgramSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalProgram",
  name: "Virtual Internship Programs for Students",
  description:
    "Structured online internship programs in AI, Machine Learning, Web Development, Data Science, Cybersecurity, and more.",
  provider: {
    "@type": "Organization",
    name: "skillinf",
    url: BASE_URL,
  },
  url: `${BASE_URL}/internships`,
  educationalCredentialAwarded: "Internship Completion Certificate",
  occupationalCredentialAwarded: "Internship Certificate",
  timeToComplete: "P4W",
  programPrerequisites: "Basic computer knowledge",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    description: "Free virtual internship enrollment",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are skillinf internships free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, enrollment in skillinf virtual internships is free. A small fee applies only if you want a certificate at the end of the program.",
      },
    },
    {
      "@type": "Question",
      name: "What internship domains does skillinf offer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "skillinf offers virtual internships in AI & Machine Learning, Full-Stack Web Development, Data Science & Analytics, Cybersecurity, Python Development, UI/UX Design, Cloud Computing, and more.",
      },
    },
    {
      "@type": "Question",
      name: "How long is a skillinf internship?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "skillinf internships are structured over 4 weeks with hands-on project tasks each week.",
      },
    },
    {
      "@type": "Question",
      name: "Will I get a certificate after completing the internship?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you receive a verifiable digital internship completion certificate after successfully completing all 4 course steps and the required tasks.",
      },
    },
    {
      "@type": "Question",
      name: "Is the internship fully online and remote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, all skillinf internships are 100% online and can be completed remotely from anywhere in India.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Favicon — explicit tags so Google Bot always finds them */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Site verification */}
        <meta name="ranknibbler-site-verification" content="186aacda7c45fec956c980c184a4beb5" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(educationProgramSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <FloatingChat />
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-CBQGRL2K5M"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CBQGRL2K5M');
          `}
        </Script>
      </body>
    </html>
  );
}
