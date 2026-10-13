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
//  --auto       what the schedule runs: posts whatever is left of today's quota
//               (SOCIAL_POSTS_PER_DAY, default 12), one after another, then stops until tomorrow.
//               Runs when Windows starts and every hour, so a PC that was off catches up.
//
// Settings in .env.local:
//   META_PAGE_ID, META_IG_USER_ID, META_PAGE_TOKEN   (written by --connect)
//   META_APP_ID, META_APP_SECRET, META_USER_TOKEN     (only needed for --connect)
//   CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY  (already there for the photo scripts)
//   SOCIAL_POSTS_PER_RUN   optional, default 1 (manual runs)
//   SOCIAL_POSTS_PER_DAY   optional, default 12 (--auto)
//   SOCIAL_GAP_MINUTES     optional, default 2: wait between posts in --auto
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
const AUTO = argv.includes('--auto');
const PER_DAY = Math.max(1, Math.min(50, parseInt(process.env.SOCIAL_POSTS_PER_DAY || '12', 10) || 12));
const GAP_MS = Math.max(0, parseFloat(process.env.SOCIAL_GAP_MINUTES || '2') || 0) * 60000;
const LOCK_PATH = path.join(__dirname, 'social_autopost.lock');
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

// Network hiccups ("fetch failed") and a slow first load of the feed are common, so GETs are
// retried a few times before giving up. Posting calls are never retried, to avoid double posts.
async function fetchRetry(url, tries = 4) {
  // Waits 3, 6, 12, 24, 48... seconds between tries (capped at 1 minute).
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (res.status < 500 || i >= tries) return res;
    } catch (e) {
      if (i >= tries) throw new Error(`could not reach ${url} (${(e.cause && e.cause.code) || e.message}). Check the internet connection and try again.`);
    }
    await new Promise(r => setTimeout(r, Math.min(60000, 3000 * 2 ** (i - 1))));
  }
}

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

const hashtag = (s) => (s || '').replace(/[^\p{L}\p{N}]+/gu, '');

// Perfume details (gender, type, accords, notes) come from the website's catalog. A field that
// still looks damaged in the data is left out rather than posted.
function detail(v) {
  let t = String(v || '').trim();
  if (/^\[[\s\S]*\]$/.test(t)) t = t.slice(1, -1).split(',').map(x => x.trim().replace(/^['"]+|['"]+$/g, '')).filter(Boolean).join(', ');
  if (!t || /\uFFFD/.test(t) || /[\u00d8-\u00db][\u0080-\u00bf]/.test(t)) return '';
  const parts = t.split(', ');
  if (parts.length >= 5 && parts.every(x => x.length <= 1)) return '';
  return t.replace(/\s+/g, ' ');
}

const GENDER = { Men: ['Men', 'رجالي'], Women: ['Women', 'نسائي'], Unisex: ['Unisex', 'للجنسين'] };
const CONCENTRATION = {
  EDP: ['Eau de Parfum', 'أو دو بارفان'], EDT: ['Eau de Toilette', 'أو دو تواليت'], EDC: ['Eau de Cologne', 'أو دو كولونيا'],
  Parfum: ['Parfum', 'بارفان'], 'Extrait de Parfum': ['Extrait de Parfum', 'إكستريه دو بارفان'],
  'Body Mist': ['Body Mist', 'معطر للجسم'], 'Hair Mist': ['Hair Mist', 'عطر للشعر'], 'Parfum de Toilette': ['Parfum de Toilette', 'بارفان دو تواليت'],
};

function detailLines(d, name) {
  if (!d) return { en: [], ar: [] };
  // Older imports filled empty cells with "Unisex" and "EDP". Trust them only when the perfume
  // was researched (has accords or notes), or when the name itself says it.
  const researched = [d.mainAccord, d.topNotes, d.heartNotes, d.baseNotes].some(v => detail(v));
  const g = (researched || d.gender !== 'Unisex') && GENDER[d.gender];
  const c = (researched || /EDP|EDT|EDC|PARFUM|EXTRAIT|MIST|COLOGNE|TOILETTE/i.test(name)) && ( CONCENTRATION[d.concentration] || (detail(d.concentration) ? [detail(d.concentration), detail(d.concentration)] : null));
  const en = [], ar = [];
  if (g) { en.push(`👤 For: ${g[0]}`); ar.push(`👤 ${g[1]}`); }
  if (c) { en.push(`💧 Type: ${c[0]}`); ar.push(`💧 ${c[1]}`); }
  const rows = [
    ['🌿 Family', d.fragranceFamily], ['🎯 Main accords', d.mainAccord],
    ['🍊 Top notes', d.topNotes], ['🌸 Heart notes', d.heartNotes], ['🪵 Base notes', d.baseNotes],
    ['🌙 Best for', d.occasion],
  ];
  for (const [label, v] of rows) { const t = detail(v); if (t) en.push(`${label}: ${t}`); }
  return { en, ar };
}

// No prices or sizes in captions: prices change in the POS, and a post stays up for good.
function caption(p, platform) {
  // Links are only clickable in Facebook posts; on Instagram the bio link is the way in.
  const shopLine = platform === 'facebook' ? `🛍️ See today's price and order: ${p.link}` : `🛍️ See today's price and order at ${SITE} (link in bio)`;
  const brandTag = hashtag(p.brand);
  const { en, ar } = detailLines(p.details, p.name);
  return [
    p.name + (p.brand && !p.name.toLowerCase().includes(p.brand.toLowerCase()) ? ` by ${p.brand}` : ''),
    '',
    ...(en.length ? [...en, ''] : []),
    '✨ 100% original, delivered across Kuwait.',
    shopLine,
    '',
    `عطر ${p.name} متوفر الآن في ABEERX`,
    ...ar,
    '✨ أصلي 100٪ مع التوصيل لجميع مناطق الكويت',
    `🛍️ اطلب الآن عبر ${SITE}`,
    '',
    ['#abeerx', '#perfume', '#fragrance', '#kuwait', '#عطور', '#عطر', '#الكويت', brandTag && `#${brandTag}`].filter(Boolean).join(' '),
  ].join('\n');
}

// The website's catalog (on R2) holds each perfume's details. Matched by the product page
// slug in the feed link, or by the feed's group id (the product's code).
async function attachDetails(products) {
  try {
    const res = await fetchRetry(`${process.env.R2_PUBLIC_BASE || R2_PUBLIC}/catalog.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const catalog = await res.json();
    const bySlug = new Map(), bySku = new Map();
    for (const c of catalog) { if (c.slug) bySlug.set(c.slug, c); if (c.sku) bySku.set(String(c.sku), c); }
    let found = 0;
    for (const p of products) {
      const slug = decodeURIComponent((p.link.match(/\/product\/([^/?#]+)/) || [])[1] || '');
      p.details = bySlug.get(slug) || bySku.get(String(p.groupId)) || null;
      if (p.details) found++;
    }
    console.log(`Perfume details found for ${found} of ${products.length}.`);
  } catch (e) {
    console.log(`Could not load perfume details (${e.message}). Posts will go out without notes.`);
  }
}

// ---------------------------------------------------------------- state

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return { round: 1, posted: {} }; }
}
function saveState(state) { fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2)); }

// Posts made today on this PC's calendar, counted from the saved post times.
function postedToday(state) {
  const day = new Date().toLocaleDateString('en-CA');
  return Object.values(state.posted || {}).filter(e => e && e.at && (e.instagram || e.facebook) && new Date(e.at).toLocaleDateString('en-CA') === day).length;
}

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
  const res = await fetchRetry(p.image);
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

  let count = COUNT;
  if (AUTO && !DRY) {
    // Only one run at a time (start-up and the hourly run can overlap). A lock older than
    // 3 hours is left over from a crash or shutdown, so it is ignored.
    try { if (Date.now() - fs.statSync(LOCK_PATH).mtimeMs < 3 * 3600000) { console.log('Another posting run is still going. Skipping.'); return; } } catch {}
    fs.writeFileSync(LOCK_PATH, String(process.pid));
    process.on('exit', () => { try { fs.unlinkSync(LOCK_PATH); } catch {} });
    const already = postedToday(loadState());
    count = PER_DAY - already;
    if (count <= 0) { console.log(`Today's ${PER_DAY} posts are already done (${already}). Next ones tomorrow.`); return; }
    console.log(`${already} posted today. Posting ${count} more, one after another.`);
  }

  const xml = FEED_FILE ? fs.readFileSync(FEED_FILE, 'utf-8') : await (async () => {
    const res = await fetchRetry(FEED_URL, AUTO ? 8 : 4);
    if (!res.ok) throw new Error(`Could not read the product feed (${res.status}) ${FEED_URL}`);
    return res.text();
  })();
  const products = groupProducts(parseFeed(xml));
  await attachDetails(products);
  const state = loadState();
  const done = Object.keys(state.posted).length;
  console.log(`${products.length} perfumes in stock. ${done} posted so far in round ${state.round || 1}.`);
  if (products.length === 0) { console.log('Nothing to post (the feed is empty).'); return; }

  if (!DRY) {
    const missing = ['META_PAGE_TOKEN', ...(PLATFORMS.includes('facebook') ? ['META_PAGE_ID'] : []), ...(PLATFORMS.includes('instagram') ? ['META_IG_USER_ID'] : [])]
      .filter(k => !process.env[k]);
    if (missing.length) { console.log(`Missing ${missing.join(', ')} in .env.local. Run Social_Connect.bat first.`); process.exit(1); }
  }

  // The preview (--dry) remembers what it showed, so the real run right after posts exactly that.
  const byId = new Map(products.map(p => [p.groupId, p]));
  const previewed = (DRY || AUTO) ? null : (state.preview || []).map(id => byId.get(id)).filter(p => p && !(state.posted[p.groupId] && PLATFORMS.every(pl => state.posted[p.groupId][pl])));
  const picked = previewed && previewed.length ? previewed : pickNext(products, state, count);
  delete state.preview;
  if (DRY) { state.preview = picked.map(p => p.groupId); saveState(state); }
  let failures = 0, failedInARow = 0, first = true;
  for (const p of picked) {
    if (AUTO && !DRY && !first && GAP_MS) await new Promise(r => setTimeout(r, GAP_MS));
    first = false;
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
    if (!entry.instagram && !entry.facebook) { delete state.posted[p.groupId]; failedInARow++; } else failedInARow = 0;
    saveState(state); // after every perfume, so a crash never re-posts what already went out
    if (failedInARow >= 3) { console.log('\n3 perfumes in a row could not be posted. Stopping until the next run.'); break; }
  }
  if (DRY) console.log('\nPreview only. Nothing was posted.');
  else console.log(failures ? `\nDone, but ${failures} post(s) failed. They will be retried next run.` : '\nDone. All posted.');
  if (failures) process.exitCode = 1;
}

if (require.main === module) run().catch(e => { console.error(e.message); process.exit(1); });

module.exports = { parseFeed, groupProducts, caption, pickNext, postedToday };
