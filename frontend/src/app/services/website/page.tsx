import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Premium Website Development Services",
  description:
    "From landing pages to complex SaaS platforms, skillinf builds fast, secure, and beautiful websites tailored to your business needs.",
  keywords: [
    "Custom Website Development",
    "React",
    "Next.js",
    "SEO Optimized Websites",
    "E-Commerce",
    "SaaS Development",
  ],
  alternates: { canonical: "/services/website" },
};

export default function Page() {
  return <PageClient />;
}
