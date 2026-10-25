import type { Metadata } from 'next';
import CareersClient from './CareersClient';

export const metadata: Metadata = {
  title: { absolute: 'Careers at Skillinf | Join Our Team' },
  description: 'Explore open job opportunities at Skillinf. We are building premium digital products and growing our team — apply now.',
  alternates: { canonical: 'https://www.skillinf.in/careers' },
};

export default function CareersPage() {
  return <CareersClient />;
}
