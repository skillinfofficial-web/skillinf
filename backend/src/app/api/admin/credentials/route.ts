import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

const MASTER_EMAIL    = 'skillinfofficial@gmail.com';
const MASTER_PASSWORD = 'skillinf@20042006';

// All admin pages with their labels
export const ALL_PAGES = [
  { key: 'dashboard',            label: 'Dashboard',              path: '/admin' },
  { key: 'add-content',         label: 'Add Content',            path: '/admin/add' },
  { key: 'internships',         label: 'Internships',            path: '/admin/internships' },
  { key: 'programs',            label: 'Programs',               path: '/admin/programs' },
  { key: 'projects',            label: 'Projects',               path: '/admin/projects' },
  { key: 'company-internships', label: 'Company Internships',    path: '/admin/company-internships' },
  { key: 'domains',             label: 'Domains',                path: '/admin/domains' },
  { key: 'batches',             label: 'Batches',                path: '/admin/batches' },
  { key: 'platforms',           label: 'Platforms',              path: '/admin/platforms' },
  { key: 'announcement',        label: 'Announcement Bar',       path: '/admin/announcement' },
  { key: 'applications',        label: 'Applications',           path: '/admin/applications' },
  { key: 'e-certificate',       label: 'E-Certificate',          path: '/admin/e-certificate' },
  { key: 'linkedin-verify',     label: 'LinkedIn Verify',        path: '/admin/linkedin-verify' },
  { key: 'physical-certs',      label: 'Physical Certificates',  path: '/admin/physical-certificates' },
  { key: 'payments',            label: 'Payments',               path: '/admin/payments' },
  { key: 'referrals',           label: 'Referrals',              path: '/admin/referrals' },
  { key: 'email-status',        label: 'Email Status',           path: '/admin/email-status' },
  { key: 'offer-codes',         label: 'Offer Codes',            path: '/admin/offer-codes' },
];

export interface PagePermission {
  key: string;
  view: boolean;
  edit: boolean;
}

export interface AdminCredential {
  _id?: string;
  label: string;       // e.g. "Verifier", "Data Filler"
  email: string;
  passwordHash: string;
  permissions: PagePermission[];
  createdAt: Date;
  isMaster?: boolean;
}

// ── GET — list all sub-admin credentials (without passwords) ──────────────────
export async function GET() {
  try {
    const db   = await getDatabase();
    const docs = await db.collection('admin_credentials').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({
      success: true,
      credentials: docs.map(d => ({
        _id:         d._id.toString(),
        label:       d.label,
        email:       d.email,
        permissions: d.permissions,
        createdAt:   d.createdAt,
      })),
      pages: ALL_PAGES,
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

// ── POST — create a new credential (requires master password confirmation) ────
export async function POST(req: NextRequest) {
  try {
    const { label, email, password, permissions, masterPassword } = await req.json();

    // Verify master password
    if (masterPassword !== MASTER_PASSWORD) {
      return NextResponse.json({ success: false, message: 'Master password incorrect.' }, { status: 403 });
    }

    if (!label?.trim())    return NextResponse.json({ success: false, message: 'Label is required.' }, { status: 400 });
    if (!email?.trim())    return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
    if (!password?.trim()) return NextResponse.json({ success: false, message: 'Password is required.' }, { status: 400 });

    // Don't allow overriding master
    if (email.trim().toLowerCase() === MASTER_EMAIL.toLowerCase()) {
      return NextResponse.json({ success: false, message: 'Cannot create credential for master email.' }, { status: 400 });
    }

    const db = await getDatabase();

    // Check duplicate email
    const existing = await db.collection('admin_credentials').findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, message: 'A credential with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.collection('admin_credentials').insertOne({
      label: label.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      permissions: permissions ?? [],
      createdAt:   new Date(),
    });

    return NextResponse.json({ success: true, message: 'Credential created successfully.' });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

// ── DELETE — remove a credential ──────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id, masterPassword } = await req.json();
    if (masterPassword !== MASTER_PASSWORD) {
      return NextResponse.json({ success: false, message: 'Master password incorrect.' }, { status: 403 });
    }
    const db = await getDatabase();
    await db.collection('admin_credentials').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
