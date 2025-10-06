import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

function createR2Client() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT; // e.g. https://<accountid>.r2.cloudflarestorage.com

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("Missing R2 configuration. Ensure R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT are set.");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function GET() {
  try {
    const bucket = process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json(
        { ok: false, error: "R2_BUCKET_NAME is not set" },
        { status: 500 }
      );
    }

    const client = createR2Client();
    // Minimal, read-only check: attempt to list up to 1 object
    const result = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 })
    );

    return NextResponse.json({
      ok: true,
      bucket,
      objectCountHint: typeof result.KeyCount === "number" ? result.KeyCount : null,
    });
  } catch (error: any) {
    const message = error?.message || "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


