import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { isAuthorizedAdminRequest, CORS_HEADERS } from "@/lib/adminAuth";

// Deleting thousands of files takes a while; the admin page calls this repeatedly until done.
export const maxDuration = 60;

const R2_ACCOUNT_ID = "2604e12a7f799efe440edaaba8db3d20";
const CONFIRM_PHRASE = "DELETE ALL PHOTOS";

function r2Client() {
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("CLOUDFLARE_ACCESS_KEY_ID / CLOUDFLARE_SECRET_ACCESS_KEY are not set in Vercel.");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

/**
 * POST /api/r2/delete-all   body: { confirm: "DELETE ALL PHOTOS" }
 * Deletes every file under products/ in the bucket. catalog.json (bucket root) is NOT touched.
 * Works in time-limited rounds: returns { done: false, remaining: true } until nothing is left,
 * so the caller should keep calling until done is true.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== CONFIRM_PHRASE) {
      return NextResponse.json({ error: "Confirmation phrase missing." }, { status: 400, headers: CORS_HEADERS });
    }

    const s3 = r2Client();
    const Bucket = process.env.CLOUDFLARE_BUCKET_NAME || "abeerx";
    const started = Date.now();
    let deleted = 0;
    let remaining = false;

    while (true) {
      if (Date.now() - started > 40_000) { remaining = true; break; }
      // Always list from the start: deleted keys disappear, so no continuation token is needed.
      const out: any = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: "products/", MaxKeys: 1000 }));
      const keys: { Key: string }[] = (out.Contents || [])
        .map((o: any) => ({ Key: String(o.Key) }))
        .filter((o: { Key: string }) => o.Key.startsWith("products/") && o.Key.length > "products/".length);
      if (keys.length === 0) break;

      const res: any = await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: keys, Quiet: true } }));
      if (res.Errors?.length) {
        throw new Error(`Cloudflare refused some deletes: ${res.Errors[0].Message || res.Errors[0].Code}`);
      }
      deleted += keys.length;
    }

    return NextResponse.json(
      { success: true, deleted, done: !remaining, remaining },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("R2 delete-all error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
