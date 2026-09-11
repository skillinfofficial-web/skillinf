import React from 'react';
import styles from '../AddContentForm.module.css';
import pStyles from './PricingSection.module.css';

interface PricingSectionProps {
  priceType: 'free' | 'paid';
  originalPrice: string;
  offerPercentage: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function PricingSection({
  priceType, originalPrice, offerPercentage, errors, onChange,
}: PricingSectionProps) {
  const price = parseFloat(originalPrice) || 0;
  const offer = parseFloat(offerPercentage) || 0;
  const finalPrice = priceType === 'paid' ? (price - (price * offer) / 100) : 0;

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Pricing</h2>

      {/* Free / Paid radio */}
      <div className={pStyles.radioGroup}>
        <label className={`${pStyles.radioCard} ${priceType === 'free' ? pStyles.radioCardActive : ''}`}>
          <input
            type="radio"
            name="priceType"
            value="free"
            checked={priceType === 'free'}
            onChange={() => { onChange('priceType', 'free'); onChange('originalPrice', ''); onChange('offerPercentage', '0'); }}
          />
          <span className={pStyles.radioLabel}>Free</span>
        </label>
        <label className={`${pStyles.radioCard} ${priceType === 'paid' ? pStyles.radioCardActive : ''}`}>
          <input
            type="radio"
            name="priceType"
            value="paid"
            checked={priceType === 'paid'}
            onChange={() => onChange('priceType', 'paid')}
          />
          <span className={pStyles.radioLabel}>Paid</span>
        </label>
      </div>

      {priceType === 'paid' && (
        <div className={styles.twoCol}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Price <span className={styles.required}>*</span></label>
            <div className={styles.unitInput}>
              <span className={styles.unit} style={{ borderRight: '1px solid var(--border)', paddingRight: 10 }}>₹</span>
              <input
                type="number"
                min="0"
                className={`${styles.input} ${errors.originalPrice ? styles.inputError : ''}`}
                value={originalPrice}
                onChange={(e) => onChange('originalPrice', e.target.value)}
                placeholder="499"
                style={{ borderLeft: 'none', borderRadius: '0 10px 10px 0' }}
              />
            </div>
            {errors.originalPrice && <p className={styles.errorText}>{errors.originalPrice}</p>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Offer</label>
            <div className={styles.unitInput}>
              <input
                type="number"
                min="0"
                max="100"
                className={`${styles.input} ${errors.offerPercentage ? styles.inputError : ''}`}
                value={offerPercentage}
                onChange={(e) => onChange('offerPercentage', e.target.value)}
                placeholder="0"
              />
              <span className={styles.unit}>%</span>
            </div>
            {errors.offerPercentage && <p className={styles.errorText}>{errors.offerPercentage}</p>}
          </div>
        </div>
      )}

      {/* Pricing summary card */}
      <div className={pStyles.summaryCard}>
        <p className={pStyles.summaryTitle}>Pricing Summary</p>
        <div className={pStyles.summaryRow}>
          <span>Original Price</span>
          <span>{priceType === 'free' ? 'Free' : price > 0 ? `₹${price.toFixed(2)}` : '—'}</span>
        </div>
        <div className={pStyles.summaryRow}>
          <span>Discount</span>
          <span>{priceType === 'free' ? '—' : `${offer}%`}</span>
        </div>
        <div className={pStyles.summaryDivider} />
        <div className={`${pStyles.summaryRow} ${pStyles.summaryFinal}`}>
          <span>Final Price</span>
          <span>{priceType === 'free' ? 'Free' : `₹${finalPrice.toFixed(2)}`}</span>
        </div>
      </div>
    </div>
  );
}
