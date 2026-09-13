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
    const emailNorm = email.trim().toLowerCase();

    // ── Check: same email + same domain = not allowed ──────────────────────
    const exactDuplicate = await db.collection('users').findOne({
      email: emailNorm,
      domain,
    });
    if (exactDuplicate) {
      return err(`You are already enrolled in ${domain} with this email. Please sign in or choose a different domain.`, 409);
    }

    // ── Existing user with same email (different domain) ───────────────────
    const existingUser = await db.collection('users').findOne({ email: emailNorm });
    let mobileHash: string;

    if (existingUser) {
      // Verify mobile matches the existing account
      const mobileMatches = await bcrypt.compare(mobileNumber.trim(), existingUser.mobileHash as string);
      if (!mobileMatches) {
        return err('This email is registered with a different mobile number. Please use your original mobile number.', 401);
      }
      // Reuse existing hash — keeps login consistent
      mobileHash = existingUser.mobileHash as string;
    } else {
      // Brand new user — hash their mobile
      mobileHash = await bcrypt.hash(mobileNumber.trim(), 12);
    }

    const now = new Date();
    const doc = {
      name:                existingUser ? (existingUser.name as string) : name.trim(),
      email:               emailNorm,
      mobileHash,
      domain,
      startDate,
      endDate,
      linkedinVerified:    false as boolean | 'pending',
      linkedinPostUrl:     null as string | null,
      steps:               { step1: false, step2: false, step3: false, step4: false },
      submissions:         { step1: null as string | null, step2: null as string | null,
                             step3: null as string | null, step4: null as string | null },
      certificateUnlocked: false,
      paymentDone:         false,
      createdAt:           now,
      updatedAt:           now,
    };

    await db.collection('users').insertOne(doc);

    const isAdditional = !!existingUser;
    return NextResponse.json({
      success: true,
      message: isAdditional
        ? `Successfully enrolled in ${domain}! You now have multiple domain internships. Please sign in and select your domain.`
        : 'Account created successfully.',
      isAdditional,
    }, { status: 201 });
  } catch (e) {
    console.error('[POST /api/auth/register]', e);
    return NextResponse.json({ success: false, message: 'Server error. Please try again.' }, { status: 500 });
  }
}

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}
