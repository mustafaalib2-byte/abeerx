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
    const { sku, images } = await req.json();
    if (!sku) return NextResponse.json({ error: "Missing SKU" }, { status: 400, headers: CORS_HEADERS });

    // 1. Fetch current catalog
    const catalogUrl = 'https://pub-209a4e728df44d029c946408e718e9c8.r2.dev/catalog.json?t=' + Date.now();
    const res = await fetch(catalogUrl);
    if (!res.ok) throw new Error("Failed to download catalog from R2");
    const catalog = await res.json();

    // 2. Find and update product
    const prod = catalog.find((p: any) => p.sku === sku);
    if (!prod) {
        return NextResponse.json({ error: "Product not found" }, { status: 404, headers: CORS_HEADERS });
    }

    prod.images = images;
    prod.updatedAt = new Date().toISOString();

    // 3. Save back to R2
    const jsonString = JSON.stringify(catalog);
    const buffer = Buffer.from(jsonString, 'utf-8');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME || "abeerx",
        Key: "catalog.json",
        Body: buffer,
        ContentType: "application/json",
      })
    );

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("R2 Update Image Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
