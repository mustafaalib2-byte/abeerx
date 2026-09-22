import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { isAuthorizedAdminRequest, CORS_HEADERS } from "@/lib/adminAuth";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://2604e12a7f799efe440edaaba8db3d20.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  try {
    const data = await req.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid catalog data array" }, { status: 400, headers: CORS_HEADERS });
    }

    const jsonString = JSON.stringify(data);
    const buffer = Buffer.from(jsonString, 'utf-8');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME || "abeerx",
        Key: "catalog.json",
        Body: buffer,
        ContentType: "application/json",
      })
    );

    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/catalog.json`;

    return NextResponse.json({ success: true, url: publicUrl }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("R2 Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
