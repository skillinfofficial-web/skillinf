import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/mongodb';

const FALLBACK_DOMAINS = [
  'AI & Machine Learning','Data Science','Web Development','Full Stack Development',
  'Python Development','Data Analytics','Cloud Computing','Cybersecurity','UI/UX Design','Automation',
];

function genReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SKL';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: Request) {
  try {
    const { name, email, mobileNumber, domain, startDate, referralCode, collegeUniversity } = await req.json();

    // endDate is always fixed: startDate + 30 days (internship duration)
    const endDateObj = startDate ? new Date(startDate) : new Date();
    endDateObj.setDate(endDateObj.getDate() + 30);
    const endDate = endDateObj.toISOString().split('T')[0];

    if (!name?.trim())         return err('Name is required.');
    if (!email?.trim())        return err('Email is required.');
    if (!mobileNumber?.trim()) return err('Mobile number is required.');
    if (!domain)               return err('Please select a domain.');
    if (!startDate)            return err('Start date is required.');
    if (!/^\d{10}$/.test(mobileNumber.trim())) return err('Enter a valid 10-digit mobile number.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return err('Enter a valid email address.');

    const db = await getDatabase();

    let validDomains: string[] = [];
    try {
      const domainDocs = await db.collection('Domains').find({}).toArray();
      validDomains = domainDocs.map((d) => d.name as string);
    } catch { /* fall through */ }
    if (validDomains.length === 0) validDomains = FALLBACK_DOMAINS;
    if (!validDomains.includes(domain)) return err(`"${domain}" is not a valid domain.`);

    const emailNorm = email.trim().toLowerCase();

    const exactDuplicate = await db.collection('users').findOne({ email: emailNorm, domain });
    if (exactDuplicate) return err(`You are already enrolled in ${domain} with this email.`, 409);

    // Validate optional referral code
    let referredBy: string | null = null;
    if (referralCode?.trim()) {
      const refUpper = referralCode.trim().toUpperCase();
      const referrer = await db.collection('users').findOne({ myReferralCode: refUpper });
      if (!referrer) return err('Invalid referral code. Please check and try again.');
      if ((referrer.email as string) === emailNorm) return err('You cannot use your own referral code.');
      referredBy = refUpper;
    }

    const existingUser = await db.collection('users').findOne({ email: emailNorm });
    let mobileHash: string;

    if (existingUser) {
      const mobileMatches = await bcrypt.compare(mobileNumber.trim(), existingUser.mobileHash as string);
      if (!mobileMatches) return err('This email is registered with a different mobile number.', 401);
      mobileHash = existingUser.mobileHash as string;
    } else {
      mobileHash = await bcrypt.hash(mobileNumber.trim(), 12);
    }

    // Reuse code for same user, generate new for first-time
    let myReferralCode: string = existingUser?.myReferralCode as string || '';
    if (!myReferralCode) {
      let attempts = 0;
      do {
        myReferralCode = genReferralCode();
        const exists = await db.collection('users').findOne({ myReferralCode });
        if (!exists) break;
      } while (++attempts < 10);
    }

    const now = new Date();
    await db.collection('users').insertOne({
      name:                existingUser ? (existingUser.name as string) : name.trim(),
      email:               emailNorm,
      mobileNumber:        mobileNumber.trim(),
      mobileHash,
      domain,
      startDate,
      endDate,
      collegeUniversity:   collegeUniversity?.trim() || null,
      myReferralCode,
      referredBy,
      linkedinVerified:    false as boolean | 'pending',
      linkedinPostUrl:     null as string | null,
      steps:               { step1: false, step2: false, step3: false, step4: false },
      submissions:         { step1: null as string|null, step2: null as string|null, step3: null as string|null, step4: null as string|null },
      certificateUnlocked: false,
      paymentDone:         false,
      createdAt:           now,
      updatedAt:           now,
    });

    const isAdditional = !!existingUser;
    return NextResponse.json({
      success: true,
      message: isAdditional
        ? `Successfully enrolled in ${domain}! Sign in and select your domain.`
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
