import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Builds the website catalog straight from the POS database (abeerx-final) and
 * publishes it to Cloudflare R2 as catalog.json — all on the server, so nothing has
 * to be run or uploaded from the shop computer.
 *
 * Called by /api/catalog/rebuild, which admin.html triggers automatically after any
 * product change (add / edit / delete / Excel import / Google Sheets sync).
 *
 * Photos are matched against the REAL list of files in the R2 bucket, so the catalog
 * can never point at a photo that doesn't exist.
 */

const FIREBASE_BASE = "https://abeerx-final-default-rtdb.firebaseio.com/abeerx";
const R2_PUBLIC_BASE = "https://pub-209a4e728df44d029c946408e718e9c8.r2.dev";
// Verified 2026-09-30: this is the account ID that actually exists. (The one in the old
// .env.local, 2604e12e7f799e4e440edaeba8db3d20, does not — it fails the TLS handshake.)
const R2_ACCOUNT_ID = "2604e12a7f799efe440edaaba8db3d20";
const MAX_IMAGES_PER_PRODUCT = 5;

function r2Client() {
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("CLOUDFLARE_ACCESS_KEY_ID / CLOUDFLARE_SECRET_ACCESS_KEY are not set in Vercel environment variables.");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

const bucketName = () => process.env.CLOUDFLARE_BUCKET_NAME || "abeerx";

async function fetchFirebase(node: string): Promise<Record<string, any>> {
  const res = await fetch(`${FIREBASE_BASE}/${node}.json`, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`Firebase ${node}: HTTP ${res.status} ${text.slice(0, 200)}`);
  const data = JSON.parse(text);
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    throw new Error(`Firebase ${node}: ${data.error}`);
  }
  return data || {};
}

async function listProductPhotos(s3: S3Client): Promise<string[]> {
  const files: string[] = [];
  let token: string | undefined = undefined;
  do {
    const out: any = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName(), Prefix: "products/", ContinuationToken: token,
    }));
    for (const obj of out.Contents || []) {
      const name = String(obj.Key || "").slice("products/".length);
      if (/\.(png|jpe?g|webp)$/i.test(name)) files.push(name);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return files;
}

// ---- photo index -----------------------------------------------------------------
const IMG_SUFFIX = /_(\d{1,2})\.(png|jpe?g|webp)$/i;          // "_2.png" = extra photo #2
const IMG_EXT = /\.(png|jpe?g|webp)$/i;

type PhotoIndex = {
  byBase: Map<string, string[]>;     // "name_sku" -> [name_sku.png, name_sku_2.png]
  byBarcode: Map<string, string[]>;  // "8411061865583" -> files
  byName: Map<string, string[]>;     // "212_men_sexy_edt_100_ml" -> files saved with a barcode
};

function buildPhotoIndex(files: string[]): PhotoIndex {
  const idx: PhotoIndex = { byBase: new Map(), byBarcode: new Map(), byName: new Map() };
  const add = (m: Map<string, string[]>, k: string, f: string) => {
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(f);
  };
  for (const f of files) {
    const lower = f.toLowerCase();
    add(idx.byBase, lower.replace(IMG_SUFFIX, "").replace(IMG_EXT, ""), f);
    const m = lower.match(/^(.+)_(\d{8,14})(?:_(\d{1,2}))?\.(png|jpe?g|webp)$/);
    if (m) {
      add(idx.byBarcode, m[2], f);
      add(idx.byName, m[1], f);
    }
  }
  return idx;
}

const photoOrder = (f: string) => {
  const m = f.match(IMG_SUFFIX);
  return m ? parseInt(m[1], 10) : 1;
};

function photosFor(safeName: string, sku: string, idx: PhotoIndex): string[] {
  const skuLower = sku.toLowerCase();
  const found = new Set<string>(idx.byBase.get(`${safeName}_${skuLower}`) || []);
  const isBarcode = /^\d{8,14}$/.test(skuLower);
  if (isBarcode) (idx.byBarcode.get(skuLower) || []).forEach(f => found.add(f));
  else (idx.byName.get(safeName) || []).forEach(f => found.add(f)); // made-up SKU: match by name
  return [...found]
    .sort((a, b) => photoOrder(a) - photoOrder(b) || a.localeCompare(b))
    .slice(0, MAX_IMAGES_PER_PRODUCT)
    .map(f => `${R2_PUBLIC_BASE}/products/${encodeURIComponent(f)}`);
}

// ---- catalog --------------------------------------------------------------------
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const safeFileName = (s: string) =>
  s.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").toLowerCase();

export function rateValue(entry: unknown): number {
  if (entry === null || entry === undefined || entry === "") return 0;
  if (typeof entry === "object") return parseFloat((entry as any).rate) || 0;
  return parseFloat(String(entry)) || 0;
}

export function buildCatalog(
  itemDetails: Record<string, any>,
  itemRates: Record<string, any>,
  photoFiles: string[],
) {
  const idx = buildPhotoIndex(photoFiles);
  const rows: any[] = [];

  for (const [key, item] of Object.entries(itemDetails)) {
    if (!item || typeof item !== "object") continue;
    const sku = String(item.sku || key);

    let basePrice = 0;
    let isDiscounted = false;
    const rateEntry = itemRates[key];
    if (rateEntry && typeof rateEntry === "object") isDiscounted = !!rateEntry.isDiscounted;
    basePrice = rateValue(rateEntry) || rateValue(item.price);

    let price = basePrice;
    let salePrice: number | undefined = undefined;
    let discountPercentage = 0;
    if (isDiscounted && basePrice > 0) {
      price = basePrice * 1.25;
      salePrice = basePrice;
      discountPercentage = 20;
    }

    const isTester = !!item.tester || /\btester\b/i.test(key) || /\(\s*t\s*\)\s*$/i.test(key);

    rows.push({
      key, sku, isTester, price, salePrice, discountPercentage,
      images: photosFor(safeFileName(key), sku, idx),
      product: {
        id: key,
        sku,
        name: key,
        brand: item.brand || "ABEERX",
        categoryId: item.category || item.scentFamily || "Uncategorized",
        gender: item.gender || "Unisex",
        shortDescription: item.concentration || "EDP",
        description: item.description || "",
        descriptionAr: item.descriptionAr || "",
        price, salePrice, discountPercentage,
        currency: "KWD",
        totalStock: 0,
        isAvailable: true,
        fragranceFamily: item.scentFamily || "General",
        topNotes: item.topNotes || "",
        heartNotes: item.heartNotes || "",
        baseNotes: item.baseNotes || "",
        mainAccord: item.mainAccord || "",
        occasion: item.occasion || "",
        origin: item.origin || "",
        size: item.size || "100ml",
        concentration: item.concentration || "EDP",
        tags: [item.concentration || "EDP", item.size || "100ml", item.occasion, item.mainAccord, item.origin].filter(Boolean),
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: false,
      },
    });
  }

  // Group rows that only differ by size / tester into one product with variants.
  const grouped = new Map<string, any>();
  const now = new Date().toISOString();
  for (const r of rows) {
    let baseName = r.key
      .replace(/\s*[-()]*\s*tester\s*[-()]*\s*$/i, "")
      .replace(/\s*\(\s*t\s*\)\s*$/i, "")
      .trim();
    let size = "100ml";
    const sizeMatch = baseName.match(/\s*[-()]*\s*(\d+)\s*(ml|oz)\s*[-()]*\s*$/i);
    if (sizeMatch) {
      baseName = baseName.substring(0, sizeMatch.index).trim();
      size = sizeMatch[1] + sizeMatch[2].toLowerCase();
    }
    const slug = slugify(baseName);
    // `key` = the item's exact name in the POS. The website uses it to look up the live
    // price and stock of each size/tester individually.
    const variant = {
      sku: r.sku, key: r.key, size, price: r.price, salePrice: r.salePrice,
      stock: 0, isAvailable: true, isTester: r.isTester,
    };

    const existing = grouped.get(slug);
    if (!existing) {
      grouped.set(slug, {
        ...r.product,
        name: baseName,
        slug,
        images: r.images,
        variants: [variant],
        testerAvailable: r.isTester ? "Yes" : "",
        _photosFromTester: r.isTester && r.images.length > 0,
        createdAt: now,
        updatedAt: now,
      });
      continue;
    }

    if (r.isTester) existing.testerAvailable = "Yes";
    if (!r.isTester) {
      if (r.product.description) existing.description = r.product.description;
      if (r.product.descriptionAr) existing.descriptionAr = r.product.descriptionAr;
    }
    if (r.images.length > 0) {
      const merged = (!r.isTester && existing._photosFromTester)
        ? [...r.images, ...existing.images]
        : [...existing.images, ...r.images];
      existing.images = [...new Set(merged)].slice(0, MAX_IMAGES_PER_PRODUCT);
      if (!r.isTester) existing._photosFromTester = false;
    }

    // One variant per size + tester flag. If two POS items collide, keep the one with a price.
    const dupe = existing.variants.find((v: any) => v.size === variant.size && v.isTester === variant.isTester);
    if (!dupe) existing.variants.push(variant);
    else if (!(dupe.price > 0) && variant.price > 0) Object.assign(dupe, variant);

    existing.variants.sort((a: any, b: any) =>
      (parseInt(a.size) - parseInt(b.size)) || ((a.isTester ? 1 : 0) - (b.isTester ? 1 : 0)));
  }

  const catalog = [...grouped.values()];
  for (const p of catalog) delete p._photosFromTester;
  return catalog;
}

export async function rebuildAndPublishCatalog() {
  const started = Date.now();
  const s3 = r2Client();
  const [itemDetails, itemRates, photoFiles] = await Promise.all([
    fetchFirebase("itemDetails"),
    fetchFirebase("itemRates"),
    listProductPhotos(s3),
  ]);

  const itemCount = Object.keys(itemDetails).length;
  if (itemCount === 0) throw new Error("Firebase returned 0 items — refusing to publish an empty catalog.");
  if (photoFiles.length === 0) throw new Error("R2 photo listing came back empty — refusing to publish a catalog with no photos.");

  const catalog = buildCatalog(itemDetails, itemRates, photoFiles);
  if (catalog.length === 0) throw new Error("Built 0 products — refusing to publish.");

  await s3.send(new PutObjectCommand({
    Bucket: bucketName(),
    Key: "catalog.json",
    Body: JSON.stringify(catalog),
    ContentType: "application/json",
    CacheControl: "public, max-age=30",
  }));

  return {
    items: itemCount,
    products: catalog.length,
    productsWithPhotos: catalog.filter(p => p.images.length > 0).length,
    photoFilesOnR2: photoFiles.length,
    seconds: Math.round((Date.now() - started) / 100) / 10,
  };
}
