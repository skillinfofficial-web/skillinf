import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FloatingChat from "@/components/shared/FloatingChat";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SkillInf | Learn. Build. Showcase. Grow.",
  description: "Turn your academic knowledge into practical, career-ready skills through structured learning, hands-on projects, and guided internship experiences.",
  keywords: ["internship", "programming", "practical skills", "AI", "Machine Learning", "development", "career ready"],
  openGraph: {
    title: "SkillInf | Practical Project-Based Learning",
    description: "Learn the right skills, build meaningful projects, and develop a portfolio you can confidently showcase.",
    type: "website",
    locale: "en_US",
    siteName: "SkillInf",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillInf | Learn. Build. Showcase. Grow.",
    description: "Turn your academic knowledge into practical, career-ready skills.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {children}
        <FloatingChat />
      </body>
    </html>
  );
}
