import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET /api/course?domain=Data+Science
// Fetches from CompanyInternships collection (matched by name === domain)
export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get('domain');
    if (!domain) return NextResponse.json({ success: false, message: 'domain param required.' }, { status: 400 });

    const db     = await getDatabase();
    // Match by exact name field in CompanyInternships collection
    const course = await db.collection('CompanyInternships').findOne({ name: domain });

    if (!course) {
      return NextResponse.json({
        success: false,
        message: `No course found for domain "${domain}". Ask admin to add it in Company Internships.`,
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, weeks: course.weeks, courseName: course.name });
  } catch (e) {
    console.error('[GET /api/course]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
