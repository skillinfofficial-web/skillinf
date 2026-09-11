'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';
import styles from './AddContentForm.module.css';
import ImageUpload from './admin/ImageUpload';
import DetailsSection from './admin/DetailsSection';
import PricingSection from './admin/PricingSection';
import SkillsSection from './admin/SkillsSection';
import ProjectsBuildSection from './admin/ProjectsBuildSection';

type ContentType = 'internship' | 'program' | 'project';

interface FormState {
  type: ContentType;
  name: string;
  slug: string;
  description: string;
  images: string[];
  link: string;
  trending: boolean;
  published: boolean;
  duration: string;
  time: string;
  teachingSection: string;
  projectCount: string;
  mentorship: string;
  priceType: 'free' | 'paid';
  originalPrice: string;
  offerPercentage: string;
  skills: string[];
  projectsToBuild: string[];
}

const blankState: FormState = {
  type: 'internship',
  name: '',
  slug: '',
  description: '',
  images: [],
  link: '',
  trending: false,
  published: false,
  duration: '',
  time: '',
  teachingSection: 'Morning',
  projectCount: '',
  mentorship: 'Available',
  priceType: 'free',
  originalPrice: '',
  offerPercentage: '0',
  skills: ['', '', ''],
  projectsToBuild: ['', ''],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFormState(defaults: Record<string, any>): FormState {
  const pricing = defaults.pricing ?? {};
  return {
    type: defaults.type ?? 'internship',
    name: defaults.name ?? '',
    slug: defaults.slug ?? '',
    description: defaults.description ?? '',
    images: defaults.images ?? [],
    link: defaults.link ?? '',
    trending: Boolean(defaults.trending),
    published: Boolean(defaults.published),
    duration: defaults.duration ? String(defaults.duration) : '',
    time: defaults.time ? String(defaults.time) : '',
    teachingSection: defaults.teachingSection ?? 'Morning',
    projectCount: defaults.projectCount ? String(defaults.projectCount) : '',
    mentorship: defaults.mentorship ?? 'Available',
    priceType: pricing.type === 'paid' ? 'paid' : 'free',
    originalPrice: pricing.originalPrice != null ? String(pricing.originalPrice) : '',
    offerPercentage: pricing.offerPercentage != null ? String(pricing.offerPercentage) : '0',
    skills: defaults.skills?.length >= 3 ? defaults.skills : [...(defaults.skills ?? []), '', '', ''].slice(0, Math.max(3, (defaults.skills ?? []).length)),
    projectsToBuild: defaults.projects?.length >= 2 ? defaults.projects : [...(defaults.projects ?? []), '', ''].slice(0, Math.max(2, (defaults.projects ?? []).length)),
  };
}

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

interface AddContentFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues?: Record<string, any>;
  editId?: string;
  contentType?: ContentType;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function AddContentForm({ defaultValues, editId, contentType }: AddContentFormProps) {
  const isEditMode = Boolean(editId);
  const router = useRouter();
  const resolvedType: ContentType = contentType ?? defaultValues?.type ?? 'internship';

  const [form, setForm] = useState<FormState>(
    defaultValues ? buildFormState({ ...defaultValues, type: resolvedType }) : blankState
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const isInternshipOrProgram = form.type === 'internship' || form.type === 'program';

  const set = (field: keyof FormState, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setDetail = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ─── Validation ────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (form.images.length < 1) errs.images = 'Upload at least one WebP image.';
    if (form.images.length > 4) errs.images = 'Maximum 4 images allowed.';

    if (form.type === 'project') {
      if (!form.link.trim()) errs.link = 'Project link is required.';
      else { try { new URL(form.link); } catch { errs.link = 'Enter a valid URL (include https://).'; } }
    }

    if (isInternshipOrProgram) {
      if (!form.duration || Number(form.duration) < 1) errs.duration = 'Enter a valid number.';
      if (!form.time || Number(form.time) < 1) errs.time = 'Enter a valid number.';
      if (!form.projectCount || Number(form.projectCount) < 1) errs.projectCount = 'Enter a valid number.';
      if (form.priceType === 'paid') {
        if (!form.originalPrice || Number(form.originalPrice) < 0) errs.originalPrice = 'Price must be 0 or more.';
        const off = Number(form.offerPercentage);
        if (isNaN(off) || off < 0 || off > 100) errs.offerPercentage = 'Offer must be 0–100.';
      }
      if (form.projectsToBuild.length < 2) errs.projectsToBuild = 'Add at least 2 projects.';
      if (form.projectsToBuild.some((p) => !p.trim())) errs.projectsToBuild = 'All project fields must be filled.';
    }

    if (form.skills.filter((s) => s.trim()).length < 3) errs.skills = 'Add at least 3 skills.';
    if (form.skills.some((s) => !s.trim())) errs.skills = 'All skill fields must be filled.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    setStatusMsg('');

    const payload = {
      type: form.type,
      name: form.name,
      slug: form.slug || toSlug(form.name),
      description: form.description,
      images: form.images,
      trending: form.trending,
      published: form.published,
      ...(form.type === 'project' && { link: form.link }),
      ...(isInternshipOrProgram && {
        duration: Number(form.duration),
        time: Number(form.time),
        teachingSection: form.teachingSection,
        projectCount: Number(form.projectCount),
        mentorship: form.mentorship,
        pricing: {
          type: form.priceType,
          originalPrice: form.priceType === 'paid' ? Number(form.originalPrice) : undefined,
          offerPercentage: form.priceType === 'paid' ? Number(form.offerPercentage) : 0,
        },
        projects: form.projectsToBuild,
      }),
      skills: form.skills,
    };

    try {
      const url = isEditMode ? `/api/content/${editId}?type=${form.type}` : '/api/content';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setStatusMsg(isEditMode ? 'Changes saved successfully!' : data.message);
        if (!isEditMode) { setForm(blankState); setErrors({}); }
        if (isEditMode) setTimeout(() => router.back(), 1500);
      } else {
        setStatus('error');
        setStatusMsg(data.message || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setStatusMsg('Network error. Please try again.');
    }
  };

  const handleCancel = () => {
    if (isEditMode) { router.back(); return; }
    setForm(blankState); setErrors({}); setStatus('idle');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>

      {/* Status banners */}
      {status === 'success' && (
        <div className={`${styles.banner} ${styles.bannerSuccess}`}>
          <CheckCircle size={18} /> {statusMsg}
        </div>
      )}
      {status === 'error' && (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          <AlertCircle size={18} /> {statusMsg}
        </div>
      )}

      {/* Card 1: Basic Info */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Basic Information</h2>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Content Type <span className={styles.required}>*</span></label>
          <select
            className={styles.select}
            value={form.type}
            disabled={isEditMode}
            onChange={(e) => { set('type', e.target.value as ContentType); setErrors({}); }}
          >
            <option value="internship">Internship</option>
            <option value="program">Program</option>
            <option value="project">Project</option>
          </select>
          {isEditMode && <p className={styles.helperText}>Content type cannot be changed when editing.</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Images <span className={styles.required}>*</span></label>
          <ImageUpload images={form.images} onChange={(imgs) => set('images', imgs)} error={errors.images} />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Name <span className={styles.required}>*</span></label>
          <input
            type="text"
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            value={form.name}
            onChange={(e) => {
              set('name', e.target.value);
              if (!form.slug || form.slug === toSlug(form.name)) {
                set('slug', toSlug(e.target.value));
              }
            }}
            placeholder={`Enter ${form.type} name`}
          />
          {errors.name && <p className={styles.errorText}>{errors.name}</p>}
        </div>

        {/* Slug */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            URL Slug
            <span className={styles.optionalBadge}>optional — auto-generated</span>
          </label>
          <div className={styles.slugWrapper}>
            <span className={styles.slugPrefix}>/{form.type}s/</span>
            <input
              type="text"
              className={`${styles.input} ${styles.slugInput}`}
              value={form.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="leave blank — fills automatically from the name"
            />
          </div>
          <p className={styles.helperText}>
            This is the web address for the course page. It fills in automatically when you type the name — you don&apos;t need to touch it.
          </p>
        </div>

        {/* Description */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={`Brief description of this ${form.type}…`}
            rows={3}
          />
          <p className={styles.helperText}>Shown on the public listing and detail pages.</p>
        </div>

        {/* Trending toggle */}
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.trending}
            onChange={(e) => set('trending', e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.checkboxLabel}>
            <span className={styles.checkboxTitle}>Mark as Trending 🔥</span>
            <span className={styles.checkboxHint}>This item will be highlighted as trending on the public site.</span>
          </span>
        </label>

        {/* Published toggle */}
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set('published', e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.checkboxLabel}>
            <span className={styles.checkboxTitle}>Published ✓</span>
            <span className={styles.checkboxHint}>Only published content appears on the public site.</span>
          </span>
        </label>

        {form.type === 'project' && (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Project Link <span className={styles.required}>*</span></label>
            <input
              type="url"
              className={`${styles.input} ${errors.link ? styles.inputError : ''}`}
              value={form.link}
              onChange={(e) => set('link', e.target.value)}
              placeholder="https://..."
            />
            {errors.link && <p className={styles.errorText}>{errors.link}</p>}
          </div>
        )}
      </div>

      {/* Card 2: Details */}
      {isInternshipOrProgram && (
        <DetailsSection
          duration={form.duration} time={form.time}
          teachingSection={form.teachingSection} projectCount={form.projectCount}
          mentorship={form.mentorship} errors={errors} onChange={setDetail}
        />
      )}

      {/* Card 3: Pricing */}
      {isInternshipOrProgram && (
        <PricingSection
          priceType={form.priceType} originalPrice={form.originalPrice}
          offerPercentage={form.offerPercentage} errors={errors} onChange={setDetail}
        />
      )}

      {/* Card 4: Skills */}
      <SkillsSection skills={form.skills} onChange={(s) => set('skills', s)} error={errors.skills} />

      {/* Card 5: Projects to Build */}
      {isInternshipOrProgram && (
        <ProjectsBuildSection projects={form.projectsToBuild} onChange={(p) => set('projectsToBuild', p)} error={errors.projectsToBuild} />
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={handleCancel} disabled={status === 'loading'}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={status === 'loading'}>
          {status === 'loading' ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Content'}
        </button>
      </div>
    </form>
  );
}
