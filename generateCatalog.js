const fs = require('fs');
const path = require('path');
const https = require('https');

const R2_BASE = "https://pub-209a4e728df44d029c946408e718e9c8.r2.dev/products";
const LOCAL_IMAGE_DIR = "C:\\Users\\user\\Desktop\\Perfume_Images";
const MAX_IMAGES_PER_PRODUCT = 5;

// ---------------------------------------------------------------------------
// IMAGES: only ever link a photo that REALLY exists on Cloudflare R2.
// A guessed filename that doesn't exist shows as a broken image on the site AND
// breaks the shop's "products with photos first" sorting — so every candidate is
// checked on R2 before it goes into the catalog. Products with no real photo get
// images: [] (exactly how the site expects "no photo").
// ---------------------------------------------------------------------------
const IMG_EXT = /\.(png|jpe?g|webp)$/i;

function buildLocalIndex() {
    let files = [];
    try {
        files = fs.readdirSync(LOCAL_IMAGE_DIR).filter(f => IMG_EXT.test(f));
    } catch (e) {
        console.log(`WARNING: could not read ${LOCAL_IMAGE_DIR} (${e.message}) — will only check exact filenames on R2.`);
    }
    const byBarcode = new Map(); // "8411061865583" -> [files]
    const byName = new Map();    // "212_men_sexy_edt_100_ml" -> [files]  (name + any barcode)
    for (const f of files) {
        const lower = f.toLowerCase();
        const m = lower.match(/^(.+)_(\d{8,14})(?:_(\d{1,2}))?\.(png|jpe?g|webp)$/);
        if (!m) continue;
        const [, namePart, barcode] = m;
        if (!byBarcode.has(barcode)) byBarcode.set(barcode, []);
        byBarcode.get(barcode).push(f);
        if (!byName.has(namePart)) byName.set(namePart, []);
        byName.get(namePart).push(f);
    }
    return { files: new Set(files), byBarcode, byName };
}

// "x_123.png" -> 1, "x_123_2.png" -> 2  (primary photo sorts first)
function imageOrder(file) {
    const m = file.toLowerCase().match(/_(\d{1,2})\.(png|jpe?g|webp)$/);
    return m ? parseInt(m[1], 10) : 1;
}

function candidateFiles(safeName, sku, index) {
    const found = new Set();
    const skuLower = String(sku).toLowerCase();
    const exactBase = `${safeName}_${skuLower}`;
    // 1) exact names the image downloader writes: name_sku.png, name_sku_2.png ...
    found.add(`${exactBase}.png`);
    for (let n = 2; n <= MAX_IMAGES_PER_PRODUCT; n++) {
        if (index.files.has(`${exactBase}_${n}.png`)) found.add(`${exactBase}_${n}.png`);
    }
    // 2) any local photo carrying this barcode, whatever the name part says
    if (/^\d{8,14}$/.test(skuLower)) {
        (index.byBarcode.get(skuLower) || []).forEach(f => found.add(f));
    }
    // 3) product has a made-up SKU (ABX-1003, SKU-17...) — find photos saved under the
    //    same product name with a real barcode instead
    if (!/^\d{8,14}$/.test(skuLower)) {
        (index.byName.get(safeName) || []).forEach(f => found.add(f));
    }
    return [...found];
}

const headAgent = new https.Agent({ keepAlive: true, maxSockets: 8 });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function headStatus(url) {
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD', agent: headAgent, timeout: 15000 }, (res) => {
            res.resume();
            resolve(res.statusCode);
        });
        req.on('timeout', () => { req.destroy(); resolve(0); });
        req.on('error', () => resolve(0));
        req.end();
    });
}

// Only a definite 200 means "photo exists" and only a definite 404 means "photo missing".
// Anything else (429 "slow down", 5xx, timeouts) is NOT an answer — retry it with a pause.
// Anything still unanswered after retries is counted as an error, and the run aborts rather
// than silently dropping real photos from the catalog.
async function checkOne(f, replies) {
    const url = `${R2_BASE}/${encodeURIComponent(f)}`;
    const waits = [1000, 3000, 6000, 12000, 20000];
    for (let attempt = 0; attempt <= waits.length; attempt++) {
        const s = await headStatus(url);
        replies[s] = (replies[s] || 0) + 1;
        if (s === 200 || s === 404) return s;
        if (attempt < waits.length) await sleep(waits[attempt]);
    }
    return -1; // still unknown
}

async function checkAllOnR2(fileNames) {
    const unique = [...new Set(fileNames)];
    const status = new Map();
    const replies = {};
    let next = 0, done = 0, errors = 0;
    async function worker() {
        while (next < unique.length) {
            const f = unique[next++];
            const s = await checkOne(f, replies);
            if (s === -1) errors++;
            status.set(f, s);
            if (++done % 500 === 0) console.log(`  checked ${done} / ${unique.length} image links on R2...`);
        }
    }
    await Promise.all(Array.from({ length: 8 }, worker));
    const found = [...status.values()].filter(s => s === 200).length;
    const missing = [...status.values()].filter(s => s === 404).length;
    console.log(`  R2 replies seen: ${JSON.stringify(replies)}  (0 = could not connect)`);
    console.log(`  Result: ${found} photos found, ${missing} not on R2, ${errors} could not be confirmed.`);
    return { status, errors, total: unique.length };
}

// Firebase security rules deny reading the whole /abeerx root ("Permission denied"),
// but allow the product nodes — so fetch only the nodes this script needs.
const DETAILS_URL = "https://abeerx-final-default-rtdb.firebaseio.com/abeerx/itemDetails.json";
const RATES_URL = "https://abeerx-final-default-rtdb.firebaseio.com/abeerx/itemRates.json";

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => {
                if (resp.statusCode !== 200) {
                    return reject(new Error(`HTTP ${resp.statusCode} from ${url}: ${data.slice(0, 200)}`));
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed.error) return reject(new Error(`Firebase said "${parsed.error}" for ${url}`));
                    resolve(parsed);
                } catch (e) {
                    reject(new Error(`Could not parse response from ${url}: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

console.log("Downloading Firebase data to generate static catalog...");
Promise.all([
    fetchJson(DETAILS_URL),
    fetchJson(RATES_URL).catch((e) => {
        console.log(`WARNING: could not read itemRates (${e.message}) — using each item's own price instead.`);
        return {};
    }),
]).then(async ([itemDetailsRaw, itemRatesRaw]) => {
    const itemDetails = itemDetailsRaw || {};
    const itemRates = itemRatesRaw || {};

    if (Object.keys(itemDetails).length === 0) {
        console.log("ERROR: itemDetails came back empty — catalog.json was NOT overwritten.");
        process.exit(1);
    }
    console.log(`Fetched ${Object.keys(itemDetails).length} items from Firebase.`);

    const localIndex = buildLocalIndex();
    console.log(`Found ${localIndex.files.size} photos in ${LOCAL_IMAGE_DIR}.`);
    const allCandidates = [];

    // We will build the exact Product[] array Next.js uses
    const products = [];
    
    for (const [key, item] of Object.entries(itemDetails)) {
        if (!item || typeof item !== 'object') continue;
        
        const sku = item.sku || `SKU-${Date.now()}`;
        
        let basePrice = 0;
        let isDiscounted = false;
        
        // itemRates entries can be a plain number (what the admin Excel importer writes)
        // or an object like { rate, isDiscounted } — handle both.
        const rateEntry = itemRates[key];
        if (rateEntry !== undefined && rateEntry !== null && rateEntry !== '') {
            if (typeof rateEntry === 'object') {
                basePrice = parseFloat(rateEntry.rate) || 0;
                isDiscounted = rateEntry.isDiscounted || false;
            } else {
                basePrice = parseFloat(rateEntry) || 0;
            }
        }
        if (!basePrice && item.price) {
            basePrice = parseFloat(item.price) || 0;
        }
        
        let finalPrice = basePrice;
        let finalSalePrice = undefined;
        let discountPercentage = 0;
        
        if (isDiscounted && basePrice > 0) {
            finalPrice = basePrice * 1.25; 
            finalSalePrice = basePrice; 
            discountPercentage = 20; 
        }
        
        const safe_product_name = key.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").toLowerCase();
        const imageCandidates = candidateFiles(safe_product_name, sku, localIndex);
        allCandidates.push(...imageCandidates);
        const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        // Tester flag: prefer the explicit "Tester" column from the master sheet, but also
        // fall back to detecting a trailing "TESTER" word or "(T)" marker already baked into
        // older product names, since a lot of existing rows encode it that way instead.
        const isTester = !!item.tester || /\btester\b/i.test(key) || /\(\s*t\s*\)\s*$/i.test(key);

        products.push({
            id: key,
            sku: sku,
            name: key,
            brand: item.brand || 'ABEERX',
            categoryId: item.category || item.scentFamily || 'Uncategorized',
            gender: item.gender || 'Unisex',
            shortDescription: item.concentration || 'EDP',
            description: item.description || '',
            descriptionAr: item.descriptionAr || '',
            isTester: isTester,
            price: finalPrice,
            salePrice: finalSalePrice,
            discountPercentage: discountPercentage,
            currency: 'KWD',
            totalStock: 99, 
            isAvailable: true,
            images: [],                      // filled in below, only with photos confirmed on R2
            _imageCandidates: imageCandidates,
            variants: [],
            fragranceFamily: item.scentFamily || 'General',
            topNotes: item.topNotes || '',
            heartNotes: item.heartNotes || '',
            baseNotes: item.baseNotes || '',
            mainAccord: item.mainAccord || '',
            occasion: item.occasion || '',
            origin: item.origin || '',
            size: item.size || '100ml',
            concentration: item.concentration || 'EDP',
            tags: [item.concentration || 'EDP', item.size || '100ml', item.occasion, item.mainAccord, item.origin].filter(Boolean),
            slug: slug,
            isFeatured: true, 
            isBestSeller: false,
            isNewArrival: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }
    
    // Confirm every candidate photo actually exists on Cloudflare R2
    console.log("Checking which photos really exist on Cloudflare (can take 5-10 minutes — leave it running)...");
    const r2 = await checkAllOnR2(allCandidates);
    if (r2.errors > 20) {
        console.log(`ERROR: ${r2.errors} of ${r2.total} photo checks could not be confirmed (Cloudflare busy or network problem).`);
        console.log("catalog.json was NOT changed, so no photos were dropped. Wait 10 minutes and run it again.");
        process.exit(1);
    }
    for (const p of products) {
        p.images = p._imageCandidates
            .filter(f => r2.status.get(f) === 200)
            .sort((a, b) => imageOrder(a) - imageOrder(b) || a.localeCompare(b))
            .slice(0, MAX_IMAGES_PER_PRODUCT)
            .map(f => `${R2_BASE}/${encodeURIComponent(f)}`);
        delete p._imageCandidates;
    }
    const rowsWithPhoto = products.filter(p => p.images.length > 0).length;
    console.log(`Photos confirmed on Cloudflare for ${rowsWithPhoto} of ${products.length} items.`);

    // Group variants
    const grouped = new Map();
    products.forEach((p) => {
        let baseName = p.name;
        let size = '100ml';

        // Strip a trailing "TESTER" word or "(T)" marker BEFORE the size match, so a tester
        // row (e.g. "MONT BLANC ULTIMATE EDP TESTER" or "...100ML(T)") groups under the same
        // product as its regular counterpart instead of becoming its own separate listing.
        baseName = baseName
            .replace(/\s*[-()]*\s*tester\s*[-()]*\s*$/i, '')
            .replace(/\s*\(\s*t\s*\)\s*$/i, '')
            .trim();

        const sizeMatch = baseName.match(/\s*[-()]*\s*(\d+)\s*(ml|oz)\s*[-()]*\s*$/i);
        if (sizeMatch) {
        baseName = baseName.substring(0, sizeMatch.index).trim();
        size = sizeMatch[1] + sizeMatch[2].toLowerCase();
        }

        const groupSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const variantEntry = {
            sku: p.sku || p.id,
            size: size,
            price: p.price,
            salePrice: p.salePrice,
            stock: p.totalStock,
            isAvailable: p.isAvailable,
            isTester: !!p.isTester
        };

        if (grouped.has(groupSlug)) {
            const existing = grouped.get(groupSlug);
            existing.variants.push(variantEntry);
            existing.totalStock += p.totalStock;
            if (p.isTester) existing.testerAvailable = 'Yes';
            // Combine photos from every row in the group (a 100ml + 200ml + tester can each
            // have their own) — regular bottle photos first, then tester photos.
            if (p.images.length > 0) {
                const regularFirst = (!p.isTester && existing._imagesFromTester)
                    ? [...p.images, ...existing.images]
                    : [...existing.images, ...p.images];
                existing.images = [...new Set(regularFirst)].slice(0, MAX_IMAGES_PER_PRODUCT);
                if (!p.isTester) existing._imagesFromTester = false;
            }
            // Prefer a non-tester row's own description/Arabic description as the product's
            // main copy, since the tester row's text (if any) is usually a duplicate.
            if (!p.isTester) {
                if (p.description) existing.description = p.description;
                if (p.descriptionAr) existing.descriptionAr = p.descriptionAr;
            }

            // Dedupe by size + tester flag (not size alone), so a tester and a regular bottle
            // of the same size both survive as distinct, selectable variants.
            const uniqueVariants = [];
            const seenKeys = new Set();
            existing.variants.forEach((v) => {
                const dedupeKey = `${v.size}__${v.isTester ? 'tester' : 'regular'}`;
                if(!seenKeys.has(dedupeKey)) {
                seenKeys.add(dedupeKey);
                uniqueVariants.push(v);
                }
            });
            existing.variants = uniqueVariants.sort((a,b) => {
                const sizeDiff = parseInt(a.size) - parseInt(b.size);
                if (sizeDiff !== 0) return sizeDiff;
                return (a.isTester ? 1 : 0) - (b.isTester ? 1 : 0);
            });
        } else {
            p.name = baseName;
            p.slug = groupSlug;
            p.variants = [variantEntry];
            p.testerAvailable = p.isTester ? 'Yes' : '';
            p._imagesFromTester = p.isTester && p.images.length > 0;
            grouped.set(groupSlug, p);
        }
    });

    const finalArray = Array.from(grouped.values());
    finalArray.forEach(p => { delete p._imagesFromTester; });
    const withPhoto = finalArray.filter(p => p.images.length > 0).length;
    console.log(`Products with at least one photo: ${withPhoto} of ${finalArray.length}.`);
    if (finalArray.length === 0) {
        console.log("ERROR: built 0 products — catalog.json was NOT overwritten.");
        process.exit(1);
    }
    fs.writeFileSync('C:\\Users\\user\\Documents\\GitHub\\abeerx\\public\\catalog.json', JSON.stringify(finalArray, null, 2));
    console.log("Generated catalog.json with " + finalArray.length + " products!");
}).catch((err) => {
    console.log("ERROR: " + err.message);
    console.log("catalog.json was NOT changed.");
    process.exit(1);
});
