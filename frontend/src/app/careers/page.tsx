import type { Metadata } from 'next';
import CareersClient from './CareersClient';

export const metadata: Metadata = {
  title: { absolute: 'Careers at SkillInf | Join Our Team' },
  description:
    'Explore open job opportunities at SkillInf. We are building premium digital products and a world-class internship platform. Browse open roles and apply today.',
  keywords: [
    'SkillInf careers', 'jobs at SkillInf', 'work at SkillInf',
    'SkillInf hiring', 'tech jobs India', 'digital agency jobs',
    'remote jobs India', 'internship platform jobs',
  ],
  alternates: { canonical: 'https://www.skillinf.in/careers' },
  openGraph: {
    type: 'website',
    url: 'https://www.skillinf.in/careers',
    siteName: 'SkillInf',
    title: 'Careers at SkillInf | Join Our Team',
    description:
      'Explore open job opportunities at SkillInf. We are building premium digital products and a world-class internship platform. Browse open roles and apply today.',
    images: [{ url: 'https://www.skillinf.in/og-image.png', width: 1200, height: 630, alt: 'SkillInf Careers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers at SkillInf | Join Our Team',
    description:
      'Explore open job opportunities at SkillInf. Browse open roles and apply today.',
    images: ['https://www.skillinf.in/og-image.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Careers at SkillInf',
  description:
    'Browse open job vacancies at SkillInf — a digital services and virtual internship platform based in India.',
  url: 'https://www.skillinf.in/careers',
  publisher: {
    '@type': 'Organization',
    name: 'SkillInf',
    url: 'https://www.skillinf.in',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.skillinf.in/skillinf-logo.png',
    },
  },
};

export default function CareersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CareersClient />
    </>
  );
}
