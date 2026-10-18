import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore skillinf's premium digital services — Website Development, AI Automation, UI/UX Design, and 3D Design.",
  keywords: ["skillinf services", "Website Development", "AI Automation", "UI/UX Design", "3D Design"],
  alternates: { canonical: "/services" },
};

export default function Page() {
  return <PageClient />;
}
