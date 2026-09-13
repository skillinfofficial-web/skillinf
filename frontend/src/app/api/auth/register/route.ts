import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/mongodb';

const DOMAINS = [
  'AI & Machine Learning',
  'Data Science',
  'Web Development',
  'Full Stack Development',
  'Python Development',
  'Data Analytics',
  'Cloud Computing',
  'Cybersecurity',
  'UI/UX Design',
  'Automation',
];

export async function POST(req: Request) {
  try {
    const { name, email, mobileNumber, domain, startDate, endDate } = await req.json();

    // ── Validation ─────────────────────────────────────────────────────────
    if (!name?.trim())         return err('Name is required.');
    if (!email?.trim())        return err('Email is required.');
    if (!mobileNumber?.trim()) return err('Mobile number is required.');
    if (!domain)               return err('Please select a domain.');
    if (!startDate)            return err('Start date is required.');
    if (!endDate)              return err('End date is required.');
    if (!DOMAINS.includes(domain)) return err('Invalid domain selected.');
    if (!/^\d{10}$/.test(mobileNumber.trim())) return err('Enter a valid 10-digit mobile number.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return err('Enter a valid email address.');

    const db = await getDatabase();

    // ── Uniqueness check ───────────────────────────────────────────────────
    const existing = await db.collection('users').findOne({ email: email.trim().toLowerCase() });
    if (existing) return err('This email is already registered. Please sign in.', 409);

    // ── Hash password (mobile number) ──────────────────────────────────────
    const mobileHash = await bcrypt.hash(mobileNumber.trim(), 12);
    const now = new Date();

    const doc = {
      name:             name.trim(),
      email:            email.trim().toLowerCase(),
      mobileHash,
      domain,
      startDate,
      endDate,
      linkedinVerified: false as boolean | 'pending',
      linkedinPostUrl:  null as string | null,
      steps: { step1: false, step2: false, step3: false, step4: false },
      submissions: { step1: null as string | null, step2: null as string | null,
                     step3: null as string | null, step4: null as string | null },
      certificateUnlocked: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').insertOne(doc);
    return NextResponse.json({ success: true, message: 'Account created successfully.' }, { status: 201 });
  } catch (e) {
    console.error('[POST /api/auth/register]', e);
    return NextResponse.json({ success: false, message: 'Server error. Please try again.' }, { status: 500 });
  }
}

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}
