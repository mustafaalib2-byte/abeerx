const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

async function run() {
  console.log("Downloading itemDetails and itemRates...");
  const itemDetails = await fetchJson("https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/itemDetails.json") || {};
  const itemRates = await fetchJson("https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/itemRates.json") || {};
  
  const products = [];
  
  for (const [key, item] of Object.entries(itemDetails)) {
      if (!item || typeof item !== 'object') continue;
      
      const sku = item.sku || `SKU-${Date.now()}`;
      let basePrice = 0;
      let isDiscounted = false;
      
      const rateVal = itemRates[key];
      if (rateVal !== undefined && rateVal !== null) {
          // The admin panel saves itemRates as plain numbers; older data used { rate, isDiscounted }.
          if (typeof rateVal === 'object') {
              basePrice = parseFloat(rateVal.rate) || 0;
              isDiscounted = rateVal.isDiscounted || false;
          } else {
              basePrice = parseFloat(rateVal) || 0;
          }
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
      
      const imageUrl = `https://pub-209a4e728df44d029c946408e718e9c8.r2.dev/products/${fileName}`;
      const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      products.push({
          id: key, 
          sku: sku,
          name: key,
          brand: item.brand || 'ABEERX',
          categoryId: item.category || item.scentFamily || 'Uncategorized',
          gender: item.gender || 'Unisex',
          shortDescription: item.concentration || 'EDP',
          description: item.description || '',
          price: finalPrice,
          salePrice: finalSalePrice,
          discountPercentage: discountPercentage,
          currency: 'KWD',
          totalStock: 99, 
          isAvailable: true,
          images: [imageUrl],
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
      
      const sizeMatch = p.name.match(/\s*[-()]*\s*(\d+)\s*(ml|oz)\s*[-()]*\s*$/i);
      if (sizeMatch) {
      baseName = p.name.substring(0, sizeMatch.index).trim();
      size = sizeMatch[1] + sizeMatch[2].toLowerCase();
      }
      
      const groupSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      if (grouped.has(groupSlug)) {
          const existing = grouped.get(groupSlug);
          existing.variants.push({
              sku: p.sku || p.id,
              size: size,
              price: p.price,
              salePrice: p.salePrice,
              stock: p.totalStock,
              isAvailable: p.isAvailable
          });
          existing.totalStock += p.totalStock;
          
          const uniqueVariants = [];
          const seenSizes = new Set();
          existing.variants.forEach((v) => {
              if(!seenSizes.has(v.size)) {
              seenSizes.add(v.size);
              uniqueVariants.push(v);
              }
          });
          existing.variants = uniqueVariants.sort((a,b) => parseInt(a.size) - parseInt(b.size));
      } else {
          p.name = baseName;
          p.slug = groupSlug;
          p.variants = [{
              sku: p.sku || p.id,
              size: size,
              price: p.price,
              salePrice: p.salePrice,
              stock: p.totalStock,
              isAvailable: p.isAvailable
          }];
          grouped.set(groupSlug, p);
      }
  });
  
  const finalArray = Array.from(grouped.values());
  fs.writeFileSync('C:\\Users\\user\\Documents\\GitHub\\abeerx\\public\\catalog.json', JSON.stringify(finalArray, null, 2));
  console.log("Generated catalog.json with " + finalArray.length + " products!");
}

run();
