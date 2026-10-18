import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "AI Automation Services",
  description:
    "Save hundreds of manual hours. skillinf builds custom AI agents and automation workflows for your sales, marketing, and operations.",
  keywords: ["AI Automation", "n8n", "AI Agents", "Chatbot Development", "Workflow Automation"],
  alternates: { canonical: "/services/ai-automation" },
};

export default function Page() {
  return <PageClient />;
}
