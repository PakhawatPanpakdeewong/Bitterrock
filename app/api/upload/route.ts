import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const newName = formData.get('newName') as string;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    if (!newName) {
      return NextResponse.json({ ok: false, error: 'No new name provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'Invalid file type. Only JPG, PNG, and GIF are allowed.' }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to public/uploads directory
    const filePath = join(uploadsDir, newName);
    await writeFile(filePath, buffer);

    // Return success with file URL
    const fileUrl = `/uploads/${newName}`;
    return NextResponse.json({ 
      ok: true, 
      url: fileUrl,
      filename: newName 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error?.message || 'Upload failed' 
    }, { status: 500 });
  }
}

