import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "3D Design & Rendering Services",
  description:
    "Photorealistic 3D designs for architecture, products, and animations by skillinf — from floor plans to full animated walkthroughs.",
  keywords: ["3D Design", "3D Rendering", "Architectural Visualization", "3D Animation", "Product Modeling"],
  alternates: { canonical: "/services/3d-design" },
};

export default function Page() {
  return <PageClient />;
}
