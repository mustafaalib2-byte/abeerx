import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://2604e12a7f799efe440edaaba8db3d20.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "762534b8472c635b562556734a5a3b58",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "2397ba96b3235b86776e6c694204906220f384c3db03acf62bffce8696119e8a",
  },
  forcePathStyle: true,
});

export async function GET(req: NextRequest) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME || "abeerx",
      Prefix: "products/"
    });
    
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

    return NextResponse.json({ success: true, files: allFiles }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error: any) {
    console.error("R2 List Error:", error);
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
