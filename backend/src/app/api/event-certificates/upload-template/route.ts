import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs   from 'fs';

// Saves uploaded template image to /public/event-templates/
// Returns the public URL.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file)
      return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ success: false, message: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });

    const dir = path.join(process.cwd(), 'public', 'event-templates');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const ext      = file.name.split('.').pop() ?? 'png';
    const safeName = `tpl_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(dir, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, url: `/event-templates/${safeName}` });
  } catch (err) {
    console.error('[POST /api/event-certificates/upload-template]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

