// Posts in-stock perfumes to the ABEERX Instagram account and Facebook Page, a few at a time.
// Run from the repo folder:  node Social_AutoPost.js        (or double-click Social_AutoPost.bat)
//
//  1. Reads the live product feed (the same one Google Shopping and the Meta catalog use), so only
//     perfumes that are in stock, priced and have a photo are ever posted.
//  2. Picks the next perfumes that have not been posted yet (remembered in social_posted.json).
//     Once every perfume has been posted, it starts the round again.
//  3. Makes a square 1080 x 1080 JPEG of the photo (Instagram does not accept WebP) and uploads it
//     to Cloudflare R2 under social/.
//  4. Posts it with an English + Arabic caption to Instagram and to the Facebook Page.
//
//  --dry        only show what would be posted; nothing is uploaded or posted
//  --count N    how many perfumes to post this run (default SOCIAL_POSTS_PER_RUN, or 1)
//  --connect    one-time setup: turns META_USER_TOKEN into a permanent Page token and saves
//               META_PAGE_ID / META_IG_USER_ID / META_PAGE_TOKEN into .env.local
//  --check      checks the saved Meta keys work, without posting
//
// Settings in .env.local:
//   META_PAGE_ID, META_IG_USER_ID, META_PAGE_TOKEN   (written by --connect)
//   META_APP_ID, META_APP_SECRET, META_USER_TOKEN     (only needed for --connect)
//   CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY  (already there for the photo scripts)
//   SOCIAL_POSTS_PER_RUN   optional, default 1
//   SOCIAL_PLATFORMS       optional, "instagram,facebook" (default) or just one of them

const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '.env.local');
(function loadEnvLocal() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
})();

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const argValue = (name) => { const i = argv.indexOf(name); return i !== -1 ? argv[i + 1] : undefined; };

const FEED_URL = process.env.SOCIAL_FEED_URL || 'https://www.abeerx.com/api/feeds/google-shopping';
const FEED_FILE = argValue('--feed-file'); // for testing with a saved copy of the feed
const COUNT = Math.max(1, Math.min(25, parseInt(argValue('--count') || process.env.SOCIAL_POSTS_PER_RUN || '1', 10) || 1));
const PLATFORMS = (process.env.SOCIAL_PLATFORMS || 'instagram,facebook').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const STATE_PATH = path.join(__dirname, 'social_posted.json');

const GRAPH = process.env.META_GRAPH_BASE || 'https://graph.facebook.com/v23.0';
const ACCOUNT_ID = '2604e12a7f799efe440edaaba8db3d20';
const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME || 'abeerx';
const R2_PUBLIC = 'https://pub-209a4e728df44d029c946408e718e9c8.r2.dev';
const SITE = 'abeerx.com';

// ---------------------------------------------------------------- feed

function unescapeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

function parseFeed(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const get = (tag) => { const r = m[1].match(new RegExp(`<g:${tag}>([\\s\\S]*?)</g:${tag}>`)); return r ? unescapeXml(r[1].trim()) : ''; };
    items.push({
      id: get('id'), groupId: get('item_group_id') || get('id'), title: get('title'), description: get('description'),
      link: get('link'), image: get('image_link'), price: parseFloat(get('price')) || 0, brand: get('brand'),
    });
  }
  return items;
}

const SIZE_RE = /\s*[-()]*\s*(\d+)\s*(ml|oz)\s*[-()]*\s*$/i;

// One post per perfume: the feed has one line per size/tester, grouped by item_group_id.
function groupProducts(items) {
  const groups = new Map();
  for (const it of items) {
    if (!it.groupId || !it.image || !(it.price > 0)) continue;
    let g = groups.get(it.groupId);
    if (!g) {
      const name = it.title.replace(/\s+-\s+[^-]*$/, '').replace(SIZE_RE, '').trim() || it.title;
      g = { groupId: it.groupId, name, brand: it.brand, link: it.link, image: it.image, options: [] };
      groups.set(it.groupId, g);
    }
    const label = it.title.includes(' - ') ? it.title.slice(it.title.lastIndexOf(' - ') + 3).trim() : '';
    g.options.push({ label, price: it.price });
  }
  for (const g of groups.values()) g.options.sort((a, b) => a.price - b.price);
  return [...groups.values()];
}

// ---------------------------------------------------------------- captions

const kwd = (n) => `${n.toFixed(3)} KWD`;
const hashtag = (s) => (s || '').replace(/[^\p{L}\p{N}]+/gu, '');

function caption(p, platform) {
  const prices = p.options.length === 1
    ? `💰 ${p.options[0].label ? p.options[0].label + ': ' : ''}${kwd(p.options[0].price)}`
    : p.options.slice(0, 4).map(o => `💰 ${o.label || 'Price'}: ${kwd(o.price)}`).join('\n');
  // Links are only clickable in Facebook posts; on Instagram the bio link is the way in.
  const shopLine = platform === 'facebook' ? `🛍️ Order now: ${p.link}` : `🛍️ Order now at ${SITE} (link in bio)`;
  const brandTag = hashtag(p.brand);
  return [
    p.name + (p.brand && !p.name.toLowerCase().includes(p.brand.toLowerCase()) ? ` by ${p.brand}` : ''),
    '',
    prices,
    '',
    '✨ 100% original, delivered across Kuwait.',
    shopLine,
    '',
    `عطر ${p.name} متوفر الآن في ABEERX`,
    '✨ أصلي 100٪ مع التوصيل لجميع مناطق الكويت',
    `🛍️ اطلب الآن عبر ${SITE}`,
    '',
    ['#abeerx', '#perfume', '#fragrance', '#kuwait', '#عطور', '#عطر', '#الكويت', brandTag && `#${brandTag}`].filter(Boolean).join(' '),
  ].join('\n');
}

// ---------------------------------------------------------------- state

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return { round: 1, posted: {} }; }
}
function saveState(state) { fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2)); }

function pickNext(products, state, count) {
  const done = (p) => { const s = state.posted[p.groupId]; return s && PLATFORMS.every(pl => s[pl]); };
  let todo = products.filter(p => !done(p));
  if (todo.length === 0 && products.length > 0) {
    // Everything has been posted once: start the next round.
    state.round = (state.round || 1) + 1;
    state.posted = {};
    todo = products.slice();
    console.log(`Every perfume has been posted. Starting round ${state.round}.`);
  }
  // Mix brands up instead of posting 30 Givenchy in a row: shuffle, then take the first of each brand.
  todo.sort(() => Math.random() - 0.5);
  const picked = [], brands = new Set();
  for (const p of todo) { if (picked.length < count && !brands.has(p.brand)) { picked.push(p); brands.add(p.brand); } }
  for (const p of todo) { if (picked.length < count && !picked.includes(p)) picked.push(p); }
  return picked;
}

// ---------------------------------------------------------------- photo

async function makeSocialPhoto(p) {
  const sharp = require('sharp');
  const res = await fetch(p.image);
  if (!res.ok) throw new Error(`photo download failed (${res.status}) ${p.image}`);
  const input = Buffer.from(await res.arrayBuffer());
  const jpg = await sharp(input)
    .flatten({ background: '#ffffff' })
    .resize(1000, 1000, { fit: 'contain', background: '#ffffff' })
    .extend({ top: 40, bottom: 40, left: 40, right: 40, background: '#ffffff' })
    .jpeg({ quality: 90 })
    .toBuffer();
  const key = `social/${String(p.groupId).replace(/[^a-zA-Z0-9_-]+/g, '-')}.jpg`;
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID, secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error('Missing CLOUDFLARE_ACCESS_KEY_ID / CLOUDFLARE_SECRET_ACCESS_KEY in .env.local');
  const s3 = new S3Client({
    region: 'auto', endpoint: process.env.R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true,
  });
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: jpg, ContentType: 'image/jpeg', CacheControl: 'public, max-age=86400' }));
  return `${process.env.R2_PUBLIC_BASE || R2_PUBLIC}/${key}`;
}

// ---------------------------------------------------------------- Meta Graph API

async function graph(method, pathname, params = {}) {
  const url = new URL(`${GRAPH}/${pathname.replace(/^\//, '')}`);
  const opts = { method };
  if (method === 'GET') for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  else opts.body = new URLSearchParams(params);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Meta: ${data.error ? data.error.message : res.status}`);
  return data;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function postInstagram(imageUrl, text) {
  const token = process.env.META_PAGE_TOKEN, ig = process.env.META_IG_USER_ID;
  const { id: container } = await graph('POST', `${ig}/media`, { image_url: imageUrl, caption: text, access_token: token });
  // Instagram fetches the photo first; publishing before it is ready fails.
  for (let i = 0; i < 20; i++) {
    const { status_code } = await graph('GET', container, { fields: 'status_code', access_token: token });
    if (status_code === 'FINISHED') break;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Instagram could not process the photo (${status_code})`);
    await sleep(3000);
  }
  const { id } = await graph('POST', `${ig}/media_publish`, { creation_id: container, access_token: token });
  return id;
}

async function postFacebook(imageUrl, text) {
  const { id, post_id } = await graph('POST', `${process.env.META_PAGE_ID}/photos`, { url: imageUrl, caption: text, access_token: process.env.META_PAGE_TOKEN });
  return post_id || id;
}

// ---------------------------------------------------------------- one-time setup

function saveEnvValues(values) {
  let text = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
  for (const [k, v] of Object.entries(values)) {
    const re = new RegExp(`^${k}=.*$`, 'm');
    text = re.test(text) ? text.replace(re, `${k}=${v}`) : `${text.replace(/\s*$/, '')}\n${k}=${v}\n`;
  }
  fs.writeFileSync(ENV_PATH, text);
}

async function connect() {
  const { META_APP_ID: appId, META_APP_SECRET: secret, META_USER_TOKEN: shortToken } = process.env;
  if (!appId || !secret || !shortToken) {
    console.log('Add META_APP_ID, META_APP_SECRET and META_USER_TOKEN to .env.local first (see the setup steps).');
    process.exit(1);
  }
  // A long-lived user token gives Page tokens that do not expire.
  const { access_token: longToken } = await graph('GET', 'oauth/access_token', {
    grant_type: 'fb_exchange_token', client_id: appId, client_secret: secret, fb_exchange_token: shortToken,
  });
  const { data: pages = [] } = await graph('GET', 'me/accounts', { fields: 'id,name,access_token,instagram_business_account{id,username}', access_token: longToken });
  if (pages.length === 0) throw new Error('No Facebook Pages found for this login. Make sure you ticked your Page when allowing access.');
  const wanted = (process.env.META_PAGE_NAME || '').toLowerCase();
  const page = pages.find(p => wanted && p.name.toLowerCase().includes(wanted)) || pages.find(p => p.instagram_business_account) || pages[0];
  console.log('Pages found:'); pages.forEach(p => console.log(`  ${p === page ? '*' : ' '} ${p.name}${p.instagram_business_account ? ` (Instagram @${p.instagram_business_account.username})` : ' (no Instagram linked)'}`));
  if (!page.instagram_business_account) console.log('Warning: this Page has no Instagram business account linked, so only Facebook posting will work.');
  saveEnvValues({
    META_PAGE_ID: page.id,
    META_PAGE_TOKEN: page.access_token,
    META_IG_USER_ID: page.instagram_business_account ? page.instagram_business_account.id : '',
  });
  console.log(`Saved the keys for "${page.name}" into .env.local. You can now run Social_AutoPost.bat.`);
}

async function check() {
  const token = process.env.META_PAGE_TOKEN;
  if (!token) { console.log('No META_PAGE_TOKEN in .env.local yet. Run Social_Connect.bat first.'); process.exit(1); }
  const page = await graph('GET', process.env.META_PAGE_ID, { fields: 'name', access_token: token });
  console.log(`Facebook Page OK: ${page.name}`);
  if (process.env.META_IG_USER_ID) {
    const ig = await graph('GET', process.env.META_IG_USER_ID, { fields: 'username', access_token: token });
    const limit = await graph('GET', `${process.env.META_IG_USER_ID}/content_publishing_limit`, { fields: 'quota_usage,config', access_token: token }).catch(() => null);
    const used = limit && limit.data && limit.data[0];
    console.log(`Instagram OK: @${ig.username}${used ? ` (${used.quota_usage} of ${used.config ? used.config.quota_total : '?'} automated posts used in the last 24 hours)` : ''}`);
  }
}

// ---------------------------------------------------------------- main

async function run() {
  if (argv.includes('--connect')) return connect();
  if (argv.includes('--check')) return check();

  const xml = FEED_FILE ? fs.readFileSync(FEED_FILE, 'utf-8') : await (async () => {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Could not read the product feed (${res.status}) ${FEED_URL}`);
    return res.text();
  })();
  const products = groupProducts(parseFeed(xml));
  const state = loadState();
  const done = Object.keys(state.posted).length;
  console.log(`${products.length} perfumes in stock. ${done} posted so far in round ${state.round || 1}.`);
  if (products.length === 0) { console.log('Nothing to post (the feed is empty).'); return; }

  if (!DRY) {
    const missing = ['META_PAGE_TOKEN', ...(PLATFORMS.includes('facebook') ? ['META_PAGE_ID'] : []), ...(PLATFORMS.includes('instagram') ? ['META_IG_USER_ID'] : [])]
      .filter(k => !process.env[k]);
    if (missing.length) { console.log(`Missing ${missing.join(', ')} in .env.local. Run Social_Connect.bat first.`); process.exit(1); }
  }

  const picked = pickNext(products, state, COUNT);
  let failures = 0;
  for (const p of picked) {
    console.log(`\n=== ${p.name} (${p.brand}) ===`);
    if (DRY) {
      console.log(`Photo: ${p.image}\n--- Instagram caption ---\n${caption(p, 'instagram')}\n--- Facebook caption ---\n${caption(p, 'facebook')}`);
      continue;
    }
    const entry = state.posted[p.groupId] || (state.posted[p.groupId] = {});
    try {
      const imageUrl = await makeSocialPhoto(p);
      if (PLATFORMS.includes('instagram') && !entry.instagram) {
        try { entry.instagram = await postInstagram(imageUrl, caption(p, 'instagram')); console.log(`Instagram: posted (${entry.instagram})`); }
        catch (e) { failures++; console.log(`Instagram: FAILED - ${e.message}`); }
      }
      if (PLATFORMS.includes('facebook') && !entry.facebook) {
        try { entry.facebook = await postFacebook(imageUrl, caption(p, 'facebook')); console.log(`Facebook: posted (${entry.facebook})`); }
        catch (e) { failures++; console.log(`Facebook: FAILED - ${e.message}`); }
      }
      entry.at = new Date().toISOString();
    } catch (e) {
      failures++; console.log(`FAILED - ${e.message}`);
    }
    if (!entry.instagram && !entry.facebook) delete state.posted[p.groupId];
    saveState(state); // after every perfume, so a crash never re-posts what already went out
  }
  if (DRY) console.log('\nPreview only. Nothing was posted.');
  else console.log(failures ? `\nDone, but ${failures} post(s) failed. They will be retried next run.` : '\nDone. All posted.');
  if (failures) process.exitCode = 1;
}

if (require.main === module) run().catch(e => { console.error(e.message); process.exit(1); });

module.exports = { parseFeed, groupProducts, caption, pickNext };
