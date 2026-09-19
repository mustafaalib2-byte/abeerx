import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";

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
    // 1. Fetch current catalog
    const catalogUrl = 'https://pub-209a4e728df44d029c946408e718e9c8.r2.dev/catalog.json?t=' + Date.now();
    const res = await fetch(catalogUrl);
    if (!res.ok) throw new Error("Failed to download catalog from R2");
    const catalog = await res.json();

    // 2. Fetch ALL files from R2
    let isTruncated = true;
    let continuationToken = undefined;
    let allFiles: string[] = [];
    
    while (isTruncated) {
      const commandArgs: any = { Bucket: process.env.CLOUDFLARE_BUCKET_NAME || "abeerx", Prefix: "products/" };
      if (continuationToken) commandArgs.ContinuationToken = continuationToken;
      
      const data = await s3Client.send(new ListObjectsV2Command(commandArgs));
      if (data.Contents) {
        allFiles = allFiles.concat(data.Contents.map(file => file.Key as string));
      }
      isTruncated = data.IsTruncated || false;
      continuationToken = data.NextContinuationToken;
    }

    // 3. Build a map of SKU -> URLs
    const skuMap = new Map<string, string[]>();
    const publicBase = 'https://pub-209a4e728df44d029c946408e718e9c8.r2.dev';

    for (const key of allFiles) {
      if (!key.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
      
      // Match SKU in filename (e.g., ..._8411061869376.png or ..._8411061869376_2.png)
      const match = key.match(/_(\d{8,14})(?:_.*)?\.\w+$/);
      if (match) {
        const sku = match[1];
        if (!skuMap.has(sku)) skuMap.set(sku, []);
        skuMap.get(sku)!.push(`${publicBase}/${key}`);
      }
    }

    // Sort the arrays so Image 1 is first, Image 2 is second, etc.
    for (const [sku, urls] of skuMap.entries()) {
      urls.sort();
    }

    // 4. Update the catalog
    let updatedCount = 0;
    for (const prod of catalog) {
      const urls = skuMap.get(prod.sku);
      if (urls && urls.length > 0) {
        prod.images = urls;
        updatedCount++;
      } else {
        prod.images = [];
      }
    }

    // 5. Save back to R2
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

    return NextResponse.json({ success: true, updatedCount }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error: any) {
    console.error("R2 Auto-Link Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
