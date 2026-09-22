import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  try {
    // Support pagination if needed
    let isTruncated = true;
    let continuationToken = undefined;
    let allFiles: any[] = [];

    while (isTruncated) {
      const commandArgs: any = {
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME || "abeerx",
        Prefix: "products/"
      };
      if (continuationToken) commandArgs.ContinuationToken = continuationToken;

      const data = await s3Client.send(new ListObjectsV2Command(commandArgs));

      if (data.Contents) {
        allFiles = allFiles.concat(data.Contents.map(file => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified
        })));
      }

      isTruncated = data.IsTruncated || false;
      continuationToken = data.NextContinuationToken;
    }

    return NextResponse.json({ success: true, files: allFiles }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("R2 List Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
