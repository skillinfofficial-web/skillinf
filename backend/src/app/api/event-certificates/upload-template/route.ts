import { NextRequest, NextResponse } from 'next/server';

// Converts the uploaded image to a base64 data URL and returns it.
// Storing as data URL in MongoDB means it works cross-origin on canvas
// without CORS issues on both the admin preview and the user frontend.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file)
      return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ success: false, message: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });

    // Limit to 4 MB
    const MAX_BYTES = 4 * 1024 * 1024;
    if (file.size > MAX_BYTES)
      return NextResponse.json({ success: false, message: 'Image must be under 4 MB.' }, { status: 400 });

    const buffer  = Buffer.from(await file.arrayBuffer());
    const base64  = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (err) {
    console.error('[POST /api/event-certificates/upload-template]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
