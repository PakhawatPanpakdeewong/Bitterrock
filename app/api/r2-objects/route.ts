import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

export async function GET(req: NextRequest) {
  try {
    const bucket = process.env.R2_BUCKET_NAME || process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json({ ok: false, error: "R2_BUCKET_NAME is not set" }, { status: 500 });
    }

    const publicBase = process.env.R2_PUBLIC_BASE || process.env.NEXT_PUBLIC_R2_PUBLIC_BASE; // e.g. https://<bucket>.<domain>
    const publicHost = process.env.R2_PUBLIC_HOST || process.env.NEXT_PUBLIC_R2_PUBLIC_HOST; // e.g. sevalla.storage

    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get("prefix") || undefined;
    const limitParam = searchParams.get("limit");
    const maxKeys = Math.max(1, Math.min(1000, Number(limitParam) || 20));

    const client = createR2Client();
    const result = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: maxKeys })
    );

    const contents = (result.Contents || []).filter((c) => !!c.Key);

    const items = contents.map((c) => {
      const key = c.Key as string;
      let url: string | null = null;
      if (publicBase) {
        // Use encodeURI to keep path separators intact
        url = encodeURI(`${publicBase.replace(/\/$/, "")}/${key}`);
      } else if (publicHost) {
        // Construct https://<bucket>.<host>/<key>
        url = encodeURI(`https://${bucket}.${publicHost.replace(/^https?:\/\//, "")}/${key}`);
      }
      return {
        key,
        size: typeof c.Size === "number" ? c.Size : null,
        lastModified: c.LastModified ? new Date(c.LastModified).toISOString() : null,
        url,
      };
    });

    return NextResponse.json({ ok: true, bucket, count: items.length, items });
  } catch (error: any) {
    const message = error?.message || "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


