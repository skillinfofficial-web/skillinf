import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ImageSlider from '@/components/catalog/ImageSlider';
import PricingCard from '@/components/catalog/PricingCard';
import BenefitsSection from '@/components/catalog/BenefitsSection';
import ApplyNowButton from '@/components/catalog/ApplyNowButton';
import styles from './InternshipDetail.module.css';

interface Pricing {
  type: 'free' | 'paid';
  originalPrice?: number | null;
  offerPercentage?: number;
  finalPrice?: number | null;
}

interface InternshipItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  images?: string[];
  duration?: number;
  time?: number;
  teachingSection?: string;
  projectCount?: number;
  mentorship?: string;
  pricing?: Pricing;
  skills?: string[];
  projects?: string[];
}

async function getItem(slug: string): Promise<InternshipItem | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/catalog/internship/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.item : null;
  } catch {
    return null;
  }
}

export default async function InternshipDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem(slug);
  if (!item) notFound();

  const isFree = !item.pricing || item.pricing.type === 'free';

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/" className={styles.breadLink}>Home</Link>
            <span className={styles.breadSep}>/</span>
            <Link href="/internships" className={styles.breadLink}>Internships</Link>
            <span className={styles.breadSep}>/</span>
            <span className={styles.breadCurrent}>{item.name}</span>
          </nav>

          {/* Image — full width on all devices */}
          <div className={styles.imageWrap}>
            <ImageSlider images={item.images ?? []} name={item.name} />
          </div>

          {/* Course info */}
          <div className={styles.contentLayout}>
            <div className={styles.contentMain}>
              {/* Title + description */}
              <section className={styles.overview}>
                <h1 className={styles.title}>{item.name}</h1>
                {item.description && <p className={styles.description}>{item.description}</p>}
              </section>

              {/* Detail chips */}
              <section className={styles.detailsSection}>
                <h2 className={styles.sectionTitle}>Course Details</h2>
                <div className={styles.detailsGrid}>
                  {item.duration && (
                    <div className={styles.detailCard}>
                      <span className={styles.detailIcon}>⏱</span>
                      <span className={styles.detailLabel}>Duration</span>
                      <span className={styles.detailValue}>{item.duration} Weeks</span>
                    </div>
                  )}
                  {item.time && (
                    <div className={styles.detailCard}>
                      <span className={styles.detailIcon}>🕐</span>
                      <span className={styles.detailLabel}>Time</span>
                      <span className={styles.detailValue}>{item.time} hrs/week</span>
                    </div>
                  )}
                  {item.teachingSection && (
                    <div className={styles.detailCard}>
                      <span className={styles.detailIcon}>🌅</span>
                      <span className={styles.detailLabel}>Timing</span>
                      <span className={styles.detailValue}>{item.teachingSection}</span>
                    </div>
                  )}
                  {item.projectCount && (
                    <div className={styles.detailCard}>
                      <span className={styles.detailIcon}>💻</span>
                      <span className={styles.detailLabel}>Projects</span>
                      <span className={styles.detailValue}>{item.projectCount} Projects</span>
                    </div>
                  )}
                  {item.mentorship && (
                    <div className={styles.detailCard}>
                      <span className={styles.detailIcon}>👥</span>
                      <span className={styles.detailLabel}>Mentorship</span>
                      <span className={styles.detailValue}>{item.mentorship}</span>
                    </div>
                  )}
                  {!isFree && item.pricing?.finalPrice && (
                    <div className={styles.detailCard}>
                      <span className={styles.detailIcon}>₹</span>
                      <span className={styles.detailLabel}>Fee</span>
                      <span className={styles.detailValue}>₹{item.pricing.finalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Skills */}
              {item.skills && item.skills.length > 0 && (
                <section className={styles.skillsSection}>
                  <h2 className={styles.sectionTitle}>Skills You&apos;ll Learn</h2>
                  <div className={styles.skillTags}>
                    {item.skills.map((skill) => (
                      <span key={skill} className={styles.skillTag}>{skill}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects to build */}
              {item.projects && item.projects.length > 0 && (
                <section className={styles.projectsSection}>
                  <h2 className={styles.sectionTitle}>Projects You&apos;ll Build</h2>
                  <ol className={styles.projectList}>
                    {item.projects.map((proj, i) => (
                      <li key={i} className={styles.projectItem}>
                        <span className={styles.projectNum}>{String(i + 1).padStart(2, '0')}</span>
                        <span className={styles.projectName}>{proj}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Benefits */}
              <BenefitsSection />

              {/* Final CTA */}
              <div className={styles.finalCta}>
                <div className={styles.ctaInner}>
                  <div>
                    <h3 className={styles.ctaTitle}>Ready to get started?</h3>
                    <p className={styles.ctaText}>Join this internship and build real skills that employers value.</p>
                  </div>
                  <ApplyNowButton itemName={item.name} itemType="internship" itemId={item._id} />
                </div>
              </div>
            </div>

            {/* Sticky pricing sidebar (desktop repeat) */}
            <div className={styles.desktopSidebar}>
              <PricingCard pricing={item.pricing} name={item.name} itemId={item._id} itemType="internship" />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sticky bar */}
      <div className={styles.mobileStickyBar}>
        <div className={styles.mobilePriceInfo}>
          {isFree ? (
            <span className={styles.mobileFree}>Free</span>
          ) : (
            <span className={styles.mobilePrice}>₹{(item.pricing?.finalPrice ?? 0).toLocaleString('en-IN')}</span>
          )}
        </div>
        <ApplyNowButton itemName={item.name} itemType="internship" itemId={item._id} variant="mobile" />
      </div>

      <Footer />
    </>
  );
}
