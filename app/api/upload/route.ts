import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function createR2Client() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("Missing R2 configuration. Ensure R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT are set.");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

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

    // Get R2 configuration
    const bucket = process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json({ ok: false, error: "R2_BUCKET_NAME is not set" }, { status: 500 });
    }

    const publicBase = process.env.R2_PUBLIC_BASE || process.env.NEXT_PUBLIC_R2_PUBLIC_BASE;
    const publicHost = process.env.R2_PUBLIC_HOST || process.env.NEXT_PUBLIC_R2_PUBLIC_HOST;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to R2
    const client = createR2Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: newName,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    await client.send(command);

    // Generate public URL
    let publicUrl: string;
    if (publicBase) {
      publicUrl = encodeURI(`${publicBase.replace(/\/$/, "")}/${newName}`);
    } else if (publicHost) {
      publicUrl = encodeURI(`https://${bucket}.${publicHost.replace(/^https?:\/\//, "")}/${newName}`);
    } else {
      publicUrl = `https://${bucket}.r2.cloudflarestorage.com/${newName}`;
    }

    return NextResponse.json({ 
      ok: true, 
      url: publicUrl,
      filename: newName,
      bucket: bucket
    });

  } catch (error: any) {
    console.error('R2 Upload error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error?.message || 'Upload to R2 failed' 
    }, { status: 500 });
  }
}