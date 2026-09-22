import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400, headers: CORS_HEADERS });

    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME || "abeerx",
      Key: key
    }));

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("R2 Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
