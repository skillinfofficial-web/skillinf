import { NextRequest, NextResponse } from 'next/server';

// Converts the uploaded image to a base64 data URL and returns it.
// Storing as data URL means the canvas can draw it without CORS issues.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    if (!file)
      return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ success: false, message: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });

    const MAX_BYTES = 4 * 1024 * 1024;
    if (file.size > MAX_BYTES)
      return NextResponse.json({ success: false, message: 'Image must be under 4 MB.' }, { status: 400 });

    const buffer  = Buffer.from(await file.arrayBuffer());
    const base64  = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
