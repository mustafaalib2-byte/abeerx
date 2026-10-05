// Downloads EVERY product photo that is on the website (Cloudflare R2, folder "products/")
// into Desktop\Website_Photos — an exact copy of what the website shows.
//
//  - Run it any time (double-click Download_Website_Photos.bat). Only new or changed photos
//    are downloaded, so later runs are quick.
//  - Photos that were removed from the website are moved to Website_Photos\_removed_from_website
//    (nothing is ever deleted on your computer).
//  - File names are kept exactly as on the website (name_barcode.webp, name_barcode_2.webp ...),
//    so the whole folder can be bulk-uploaded again later and every photo lands on the right product.
//  - This script only READS from Cloudflare. It never changes or deletes anything there.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

(function loadEnvLocal() {
  const p = path.join(__dirname, '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
})();

const ACCOUNT_ID = '2604e12a7f799efe440edaaba8db3d20';
const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME || 'abeerx';
const PREFIX = 'products/';
const OUT_DIR = process.env.PHOTO_BACKUP_DIR || path.join(os.homedir(), 'Desktop', 'Website_Photos');
const REMOVED_DIR = path.join(OUT_DIR, '_removed_from_website');

function client() {
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID, secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error('Missing CLOUDFLARE_ACCESS_KEY_ID / CLOUDFLARE_SECRET_ACCESS_KEY in .env.local');
  return new S3Client({ region: 'auto', endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });
}

async function listAll(s3) {
  const out = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX, ContinuationToken: token }));
    for (const o of res.Contents || []) {
      const name = o.Key.slice(PREFIX.length);
      if (name && !name.includes('/')) out.push({ key: o.Key, name, size: o.Size });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

async function bodyToBuffer(body) {
  if (body && typeof body.transformToByteArray === 'function') return Buffer.from(await body.transformToByteArray());
  const chunks = [];
  for await (const c of body) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

async function main() {
  const s3 = client();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Reading the list of photos on the website...');
  const remote = await listAll(s3);
  console.log(`Photos on the website: ${remote.length}`);
  console.log(`Saving to: ${OUT_DIR}\n`);

  const todo = remote.filter(r => {
    const p = path.join(OUT_DIR, r.name);
    return !(fs.existsSync(p) && fs.statSync(p).size === r.size);
  });
  console.log(`Already up to date: ${remote.length - todo.length}   To download: ${todo.length}`);

  let i = 0, done = 0, failed = 0;
  async function worker() {
    while (i < todo.length) {
      const r = todo[i++];
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: r.key }));
          const buf = await bodyToBuffer(res.Body);
          const tmp = path.join(OUT_DIR, r.name + '.part');
          fs.writeFileSync(tmp, buf);
          fs.renameSync(tmp, path.join(OUT_DIR, r.name));
          ok = true;
        } catch (e) { if (attempt === 2) console.log(`  Failed ${r.name}: ${e.message}`); }
      }
      ok ? done++ : failed++;
      if ((done + failed) % 200 === 0) console.log(`  ...${done + failed}/${todo.length}`);
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));

  // Photos on this computer that are no longer on the website -> set aside, never deleted
  const remoteNames = new Set(remote.map(r => r.name));
  const local = fs.readdirSync(OUT_DIR).filter(f => fs.statSync(path.join(OUT_DIR, f)).isFile() && !f.endsWith('.part'));
  const gone = local.filter(f => !remoteNames.has(f));
  if (gone.length) {
    fs.mkdirSync(REMOVED_DIR, { recursive: true });
    for (const f of gone) fs.renameSync(path.join(OUT_DIR, f), path.join(REMOVED_DIR, f));
  }

  console.log('\n==================================');
  console.log(`Downloaded now      : ${done}`);
  console.log(`Failed              : ${failed}${failed ? '  (run again to retry)' : ''}`);
  console.log(`Removed from website: ${gone.length}${gone.length ? '  (moved to _removed_from_website)' : ''}`);
  console.log(`Total in folder     : ${remote.length - failed}`);
  console.log(`Folder              : ${OUT_DIR}`);
  console.log('ALL DONE.');
}

if (require.main === module) {
  main().catch(e => { console.error('\nERROR: ' + e.message); process.exitCode = 1; });
}
module.exports = { main };
