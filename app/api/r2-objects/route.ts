import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, type ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

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
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[R2 Objects API] Config:', {
        bucket,
        publicBase,
        publicHost,
        hasPublicBase: !!publicBase,
        hasPublicHost: !!publicHost,
      });
    }

    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get("prefix") || undefined;
    const limitParam = searchParams.get("limit");
    const maxKeys = Math.max(1, Math.min(1000, Number(limitParam) || 20));
    const allItems = searchParams.get("all") === "true"; // Load all items with pagination

    const client = createR2Client();
    
    let contents: Array<{ Key?: string; Size?: number; LastModified?: Date }> = [];
    let continuationToken: string | undefined = undefined;
    
    do {
      const command: InstanceType<typeof ListObjectsV2Command> = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: allItems ? 1000 : maxKeys,
        ContinuationToken: continuationToken,
      });
      
      const result: ListObjectsV2CommandOutput = await client.send(command);
      if (result.Contents) {
        contents.push(...result.Contents);
      }
      continuationToken = result.NextContinuationToken;
      
      // If not loading all items, break after first request
      if (!allItems) break;
    } while (continuationToken);

    const filteredContents = contents.filter((c) => !!c.Key);

    const items = filteredContents.map((c, index) => {
      const key = c.Key as string;
      let url: string | null = null;
      if (publicBase) {
        // Use encodeURI to keep path separators intact
        url = encodeURI(`${publicBase.replace(/\/$/, "")}/${key}`);
      } else if (publicHost) {
        // Construct https://<bucket>.<host>/<key>
        url = encodeURI(`https://${bucket}.${publicHost.replace(/^https?:\/\//, "")}/${key}`);
      }
      
      // Debug logging for first few items (only in development)
      if (process.env.NODE_ENV !== 'production' && index < 3) {
        console.log(`[R2 Objects API] Image URL for ${key}:`, url);
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


