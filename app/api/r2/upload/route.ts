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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const prefix = formData.get("prefix") as string || "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400, headers: CORS_HEADERS });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean filename
    let rawName = file.name;
    if (rawName.includes("/")) rawName = rawName.split("/").pop() as string;
    if (rawName.includes("\\")) rawName = rawName.split("\\").pop() as string;
    const safeName = rawName.replace(/[^a-zA-Z0-9.\-_]/g, "_").toLowerCase();
    const key = `${prefix}/${safeName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME || "abeerx",
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL || 'https://pub-209a4e728df44d029c946408e718e9c8.r2.dev'}/${key}`;

    return NextResponse.json({ success: true, url: publicUrl, key }, {
      headers: CORS_HEADERS
    });
  } catch (error: any) {
    console.error("R2 Upload Error:", error);
    return NextResponse.json({ error: error.message }, {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
