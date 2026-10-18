import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "UI/UX Design Services",
  description:
    "Pixel-perfect, intuitive UI/UX designs by skillinf for websites, apps, dashboards, and SaaS products that users love.",
  keywords: ["UI UX Design", "Figma Design", "Prototyping", "Mobile App Design", "Dashboard Design"],
  alternates: { canonical: "/services/ui-ux-design" },
};

export default function Page() {
  return <PageClient />;
}
