const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Load .env.local manually (no dotenv dependency needed) so this script
// can be run directly with `node upload_to_r2.js` from the repo root.
(function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
})();

const ACCOUNT_ID = "2604e12e7f799e4e440edaeba8db3d20";
const ACCESS_KEY = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME || "abeerx";
const IMAGE_DIR = "C:\\Users\\user\\Desktop\\Perfume_Images";

if (!ACCESS_KEY || !SECRET_KEY) {
  console.log("Missing CLOUDFLARE_ACCESS_KEY_ID / CLOUDFLARE_SECRET_ACCESS_KEY. Set them in .env.local before running this script.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

async function run() {
  if (!fs.existsSync(IMAGE_DIR)) {
    console.log("Directory not found.");
    return;
  }

  const files = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
  console.log(`Found ${files.length} images.`);

  console.log("Fetching existing images from R2...");
  const existing = new Set();
  try {
    let isTruncated = true;
    let continuationToken = undefined;
    while (isTruncated) {
      const resp = await s3Client.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'products/',
        ContinuationToken: continuationToken
      }));
      if (resp.Contents) {
        resp.Contents.forEach(obj => {
          existing.add(obj.Key.split('/').pop());
        });
      }
      isTruncated = resp.IsTruncated;
      continuationToken = resp.NextContinuationToken;
    }
    console.log(`Found ${existing.size} existing images.`);
  } catch (e) {
    console.log("Error listing existing images:", e.message);
  }

  console.log("Starting upload...");
  let uploaded = 0;
  let failed = 0;

  // Use a concurrency limit to not overwhelm the network
  const CONCURRENCY = 15;
  let i = 0;

  async function worker() {
    while (i < files.length) {
      const filename = files[i++];
      if (existing.has(filename)) {
        continue;
      }

      const filepath = path.join(IMAGE_DIR, filename);
      const key = `products/${filename}`;
      const contentType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

      try {
        const fileBuffer = fs.readFileSync(filepath);
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType
        }));
        uploaded++;
        if (uploaded % 100 === 0) console.log(`Uploaded ${uploaded} images...`);
      } catch (e) {
        console.log(`Failed to upload ${filename}: ${e.message}`);
        failed++;
      }
    }
  }

  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  console.log(`Finished! Uploaded: ${uploaded}, Failed: ${failed}`);

  // Also upload the catalog JSON
  console.log("Uploading catalog.json to root...");
  const catalogBuffer = fs.readFileSync('C:\\Users\\user\\Documents\\GitHub\\abeerx\\public\\catalog.json');
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: "catalog.json",
    Body: catalogBuffer,
    ContentType: "application/json"
  }));
  console.log("Uploaded catalog.json successfully.");
}

run();
