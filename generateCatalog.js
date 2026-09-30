const fs = require('fs');
const path = require('path');
const https = require('https');

const dbUrl = "https://abeerx-final-default-rtdb.firebaseio.com/abeerx.json";
const R2_BASE = "https://pub-209a4e728df44d029c946408e718e9c8.r2.dev/products";
// Local folder used only to check WHICH suffixed images (_2, _3) actually exist,
// so we don't add broken image URLs for products that only have one photo.
const LOCAL_IMAGE_DIR = "C:\\Users\\user\\Desktop\\Perfume_Images";
const MAX_IMAGES_PER_PRODUCT = 3;

function buildImageUrls(fileName) {
    // fileName already ends in .png, e.g. "212_vip_men_edt_100_ml_8411061723760.png"
    const base = fileName.replace(/\.png$/i, '');
    const urls = [`${R2_BASE}/${fileName}`]; // primary image, always included
    for (let n = 2; n <= MAX_IMAGES_PER_PRODUCT; n++) {
        const suffixedFile = `${base}_${n}.png`;
        try {
            if (fs.existsSync(path.join(LOCAL_IMAGE_DIR, suffixedFile))) {
                urls.push(`${R2_BASE}/${suffixedFile}`);
            }
        } catch (e) {
            // LOCAL_IMAGE_DIR not reachable from this machine — just skip extra-image detection
        }
    }
    return urls;
}

console.log("Downloading Firebase data to generate static catalog...");
https.get(dbUrl, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const abeerx = JSON.parse(data);
    const itemDetails = abeerx.itemDetails || {};
    const itemRates = abeerx.itemRates || {};
    
    // We will build the exact Product[] array Next.js uses
    const products = [];
    
    for (const [key, item] of Object.entries(itemDetails)) {
        if (!item || typeof item !== 'object') continue;
        
        const sku = item.sku || `SKU-${Date.now()}`;
        
        let basePrice = 0;
        let isDiscounted = false;
        
        if (itemRates[key]) {
            basePrice = parseFloat(itemRates[key].rate) || 0;
            isDiscounted = itemRates[key].isDiscounted || false;
        } else if (item.price) {
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
        
        const safe_product_name = key.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
        const fileName = `${safe_product_name}_${sku}.png`.toLowerCase();

        const imageUrls = buildImageUrls(fileName);
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
            images: imageUrls,
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
            grouped.set(groupSlug, p);
        }
    });

    const finalArray = Array.from(grouped.values());
    fs.writeFileSync('C:\\Users\\user\\Documents\\GitHub\\abeerx\\public\\catalog.json', JSON.stringify(finalArray, null, 2));
    console.log("Generated catalog.json with " + finalArray.length + " products!");
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
