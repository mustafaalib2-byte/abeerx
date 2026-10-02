// One-click photo refresh. Run from the repo folder:  node Refresh_Photos.js   (or double-click Refresh_Photos.bat)
//
//  1. Reads verification_log.csv -> works out exactly which photo files are AI-verified.
//  2. MOVES every other file out of Desktop\Perfume_Images into Desktop\Perfume_Images_Unverified (nothing deleted locally).
//  3. Makes compressed copies (800 x 800 max, WebP) in Desktop\\Perfume_Images_800 - originals are never changed.
//  4. Uploads the compressed copies to Cloudflare (overwriting same-named files).
//  5. Deletes from Cloudflare every photo that is NOT one of those compressed copies - this also removes the
//     old full-size .png files - but only if every upload succeeded.
//  6. Tells the website to rebuild its catalog.
//
// Add "--dry" to only show the numbers without changing anything.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

(function loadEnvLocal() {
  const p = path.join(__dirname, '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
})();

const DRY = process.argv.includes('--dry');
const DESKTOP = path.join(os.homedir(), 'Desktop');
const IMAGE_DIR = path.join(DESKTOP, 'Perfume_Images');
const OLD_DIR = path.join(DESKTOP, 'Perfume_Images_Unverified');
const SMALL_DIR = path.join(DESKTOP, 'Perfume_Images_800');
const LOG = path.join(DESKTOP, 'verification_log.csv');

const ACCOUNT_ID = '2604e12a7f799efe440edaaba8db3d20';
const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME || 'abeerx';
const ADMIN_KEY = 'a127df916e828b3e321633cf9f5f53497041cae321fb866b';

// ---- tiny CSV parser (handles quoted fields with commas / newlines) ----
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows;
}

// identical to safe_filename() in Download_Images_v3.py
function safeFilename(name, sku, suffix) {
  let s = Array.from(name).map(c => (/[\p{L}\p{N}]/u.test(c) ? c : '_')).join('');
  s = s.replace(/^_+|_+$/g, '').replace(/_+/g, '_');
  return `${s}_${sku}${suffix || ''}.png`.toLowerCase();
}

function verifiedSet() {
  const rows = parseCsv(fs.readFileSync(LOG, 'utf-8'));
  const h = rows[0]; const ix = n => h.indexOf(n);
  const keep = new Set();
  for (const r of rows.slice(1)) {
    if (r[ix('status')] !== 'verified') continue;
    const n = parseInt(r[ix('images_saved')] || '0', 10);
    for (let i = 1; i <= n; i++) keep.add(safeFilename(r[ix('name')], r[ix('sku')], i === 1 ? '' : `_${i}`));
  }
  return keep;
}

async function main() {
  if (!fs.existsSync(LOG) || !fs.existsSync(IMAGE_DIR)) throw new Error('verification_log.csv or Perfume_Images not found on the Desktop.');
  const keep = verifiedSet();
  const files = fs.readdirSync(IMAGE_DIR).filter(f => fs.statSync(path.join(IMAGE_DIR, f)).isFile());
  const good = files.filter(f => keep.has(f.toLowerCase()));
  const bad = files.filter(f => !keep.has(f.toLowerCase()));
  const have = new Set(files.map(f => f.toLowerCase()));
  const missing = [...keep].filter(f => !have.has(f));

  console.log(`Verified photos expected : ${keep.size}`);
  console.log(`In Perfume_Images now    : ${files.length}`);
  console.log(`  verified (keep)        : ${good.length}`);
  console.log(`  unverified (move out)  : ${bad.length}`);
  console.log(`  verified but missing   : ${missing.length}${missing.length ? '  e.g. ' + missing.slice(0, 3).join(', ') : ''}`);
  if (DRY) { console.log('\nDry run - nothing changed.'); return; }
  if (good.length < 500) throw new Error('Too few verified photos matched - stopping so nothing gets wiped by mistake.');

  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID, secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error('Missing CLOUDFLARE_ACCESS_KEY_ID / CLOUDFLARE_SECRET_ACCESS_KEY in .env.local');
  const s3 = new S3Client({ region: 'auto', endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });

  // 1) move unverified files out of the way
  fs.mkdirSync(OLD_DIR, { recursive: true });
  for (const f of bad) fs.renameSync(path.join(IMAGE_DIR, f), path.join(OLD_DIR, f));
  console.log(`\nMoved ${bad.length} unverified files to Perfume_Images_Unverified.`);

  // 2) compressed copies (originals untouched)
  let py = null;
  for (const cmd of ['python', 'py', 'python3']) {
    if (spawnSync(cmd, ['--version']).status === 0) { py = cmd; break; }
  }
  if (!py) throw new Error('Python was not found, so the photos could not be compressed.');
  console.log('\nCompressing photos to 800 x 800 WebP (originals are kept)...');
  const r = spawnSync(py, [path.join(__dirname, 'Make_Compressed_Photos.py')], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Compression failed - nothing was uploaded or deleted.');
  const small = good.map(f => f.replace(/\.[^.]+$/, '').toLowerCase() + '.webp');
  const notMade = small.filter(f => !fs.existsSync(path.join(SMALL_DIR, f)));
  if (notMade.length) throw new Error(`${notMade.length} compressed photos are missing (e.g. ${notMade[0]}) - nothing was uploaded or deleted.`);

  // 3) upload every compressed photo (overwrites same-named files)
  let i = 0, uploaded = 0, failed = 0;
  async function worker() {
    while (i < small.length) {
      const f = small[i++];
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: `products/${f}`, Body: fs.readFileSync(path.join(SMALL_DIR, f)), ContentType: 'image/webp', CacheControl: 'public, max-age=86400' }));
          ok = true;
        } catch (e) { if (attempt === 2) console.log(`Failed ${f}: ${e.message}`); }
      }
      ok ? uploaded++ : failed++;
      if ((uploaded + failed) % 200 === 0) console.log(`  ...${uploaded + failed}/${small.length}`);
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));
  console.log(`Uploaded ${uploaded}, failed ${failed}.`);
  if (failed > 0) throw new Error('Some uploads failed, so old photos on Cloudflare were NOT deleted. Run this again.');

  // 4) delete everything on Cloudflare that is not a compressed verified photo (incl. old full-size .png)
  const goodSet = new Set(small);
  const toDelete = []; let token;
  do {
    const out = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'products/', ContinuationToken: token }));
    for (const o of out.Contents || []) {
      const name = o.Key.slice('products/'.length);
      if (name && !goodSet.has(name.toLowerCase())) toDelete.push(o.Key);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  for (let k = 0; k < toDelete.length; k += 1000) {
    await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: toDelete.slice(k, k + 1000).map(Key => ({ Key })), Quiet: true } }));
  }
  console.log(`Deleted ${toDelete.length} old/unverified photos from Cloudflare.`);

  // 5) rebuild the website catalog
  try {
    const res = await fetch('https://abeerx.vercel.app/api/catalog/rebuild', { method: 'POST', headers: { 'x-admin-key': ADMIN_KEY } });
    const j = await res.json().catch(() => ({}));
    console.log(res.ok && j.success ? `Website updated: ${j.products} products, ${j.productsWithPhotos} with photos.` : `Website update failed: ${j.error || res.status} - click "Update website now" in the POS.`);
  } catch (e) { console.log('Could not reach website: ' + e.message + ' - click "Update website now" in the POS.'); }
  console.log('\nALL DONE.');
}

main().catch(e => { console.error('\nERROR: ' + e.message); process.exitCode = 1; });
