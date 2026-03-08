import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { logFetchFailure } from '@/lib/fetch-log';

function createSlipsR2Client() {
  const accessKeyId = process.env.R2_SLIPS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SLIPS_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_SLIPS_ENDPOINT;
  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      'Missing R2 Slips configuration. Ensure R2_SLIPS_ACCESS_KEY_ID, R2_SLIPS_SECRET_ACCESS_KEY, and R2_SLIPS_ENDPOINT are set.'
    );
  }
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const EXTENSIONS = ['', '.jpg', '.jpeg', '.png', '.gif', '.webp'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string; paymentId: string }> }
) {
  try {
    const { orderId, paymentId } = await params;
    if (!orderId || !paymentId) {
      return NextResponse.json(
        { ok: false, error: 'orderId และ paymentId จำเป็น' },
        { status: 400 }
      );
    }

    const bucket = process.env.R2_SLIPS_BUCKET_NAME;
    if (!bucket) {
      await logFetchFailure({
        source: 'slips',
        resourceType: 'config',
        resourceId: `${orderId}/${paymentId}`,
        errorMessage: 'R2_SLIPS_BUCKET_NAME is not set',
        httpStatus: 500,
      });
      return NextResponse.json(
        { ok: false, error: 'R2_SLIPS_BUCKET_NAME is not set' },
        { status: 500 }
      );
    }

    const client = createSlipsR2Client();
    // Path structure in R2: slips/{orderId}/{paymentId}/ (e.g. slips/54/21/)
    const prefix = `slips/${orderId}/${paymentId}/`;

    // List objects with prefix to find the actual file (handle pagination)
    let key: string | undefined;
    let continuationToken: string | undefined;
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 100,
        ContinuationToken: continuationToken,
      });
      const listResult = await client.send(listCommand);
      const contents = listResult.Contents || [];
      const fileKey = contents
        .filter((c) => c.Key && !c.Key.endsWith('/'))
        .sort((a, b) => (a.Key || '').localeCompare(b.Key || ''))[0]?.Key;
      if (fileKey) {
        key = fileKey;
        break;
      }
      continuationToken = listResult.NextContinuationToken;
    } while (continuationToken);

    if (!key) {
      // Fallback: try keys with extensions directly under slips/orderId/paymentId
      const basePrefix = `slips/${orderId}/${paymentId}`;
      for (const ext of EXTENSIONS) {
        const tryKey = ext ? `${basePrefix}${ext}` : `${basePrefix}`;
        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: tryKey,
          });
          const result = await client.send(getCommand);
          if (result.Body) {
            const contentType =
              result.ContentType || (ext.includes('png') ? 'image/png' : 'image/jpeg');
            const chunks: Uint8Array[] = [];
            for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
              },
            });
          }
        } catch {
          continue;
        }
      }
      await logFetchFailure({
        source: 'slips',
        resourceType: 'slip',
        resourceId: `${orderId}/${paymentId}`,
        errorMessage: 'ไม่พบสลิปสำหรับ orderId และ paymentId นี้',
        httpStatus: 404,
      });
      return NextResponse.json(
        { ok: false, error: 'ไม่พบสลิปสำหรับ orderId และ paymentId นี้' },
        { status: 404 }
      );
    }

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const result = await client.send(getCommand);
    if (!result.Body) {
      await logFetchFailure({
        source: 'slips',
        resourceType: 'slip',
        resourceId: `${orderId}/${paymentId}`,
        errorMessage: 'ไม่สามารถโหลดไฟล์ได้',
        httpStatus: 500,
      });
      return NextResponse.json(
        { ok: false, error: 'ไม่สามารถโหลดไฟล์ได้' },
        { status: 500 }
      );
    }

    const contentType = result.ContentType || 'image/jpeg';
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Slips API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    try {
      const { orderId, paymentId } = await params;
      await logFetchFailure({
        source: 'slips',
        resourceType: 'slip',
        resourceId: orderId && paymentId ? `${orderId}/${paymentId}` : undefined,
        errorMessage: message,
        httpStatus: 500,
      });
    } catch {
      // ignore log failure
    }
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
