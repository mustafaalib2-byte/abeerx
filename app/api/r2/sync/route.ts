import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
  },
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
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
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
