'use client';

import React from 'react';
import ApplyNowButton from './ApplyNowButton';
import styles from './PricingCard.module.css';

interface Pricing {
  type: 'free' | 'paid';
  originalPrice?: number | null;
  offerPercentage?: number;
  finalPrice?: number | null;
}

interface PricingCardProps {
  pricing?: Pricing;
  name: string;
  itemId: string;
  itemType: 'internship' | 'program';
}

export default function PricingCard({ pricing, name, itemId, itemType }: PricingCardProps) {
  const isFree = !pricing || pricing.type === 'free';
  const hasDiscount = !isFree && (pricing?.offerPercentage ?? 0) > 0;
  const final = pricing?.finalPrice ?? pricing?.originalPrice ?? 0;

  return (
    <div className={styles.card}>
      <h3 className={styles.label}>Enroll in this {name}</h3>

      <div className={styles.priceBlock}>
        {isFree ? (
          <p className={styles.freePrice}>Free</p>
        ) : (
          <>
            {hasDiscount && pricing?.originalPrice != null && (
              <p className={styles.originalPrice}>₹{pricing.originalPrice.toLocaleString('en-IN')}</p>
            )}
            <p className={styles.finalPrice}>₹{final.toLocaleString('en-IN')}</p>
            {hasDiscount && (
              <p className={styles.saving}>Save {pricing?.offerPercentage}%</p>
            )}
          </>
        )}
      </div>

      <ApplyNowButton
        itemName={name}
        itemType={itemType}
        itemId={itemId}
        variant="sidebar"
      />
    </div>
  );
}

