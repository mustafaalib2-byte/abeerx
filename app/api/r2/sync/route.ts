import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://2604e12a7f799efe440edaaba8db3d20.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "762534b8472c635b562556734a5a3b58",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "2397ba96b3235b86776e6c694204906220f384c3db03acf62bffce8696119e8a",
  },
  forcePathStyle: true,
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid catalog data array" }, { status: 400 });
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

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("R2 Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
