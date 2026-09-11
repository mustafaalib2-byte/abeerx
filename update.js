const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

html = html.replace(
  /let skuIdx\s*=\s*getIdx\(\['sku'\]\);[\s\S]*?let brandIdx\s*=\s*getIdx\(\['brand'\]\);/,
  let skuIdx    = getIdx(['sku']); 
      let itemIdx   = getIdx(['item', 'name']); 
      let brandIdx  = getIdx(['brand']);
      let rateIdx   = getIdx(['price', 'rate', 'sale price']);
      let genderIdx = getIdx(['gender']);
      let concIdx   = getIdx(['concentration']);
      let sizeIdx   = getIdx(['size', 'volume']);
      let famIdx    = getIdx(['scent family']);
      let topIdx    = getIdx(['top notes']);
      let heartIdx  = getIdx(['heart notes', 'middle notes']);
      let baseIdx   = getIdx(['base notes']);
      let descIdx   = getIdx(['description']);
);

html = html.replace(
  /let excelSku = skuIdx !== -1[\s\S]*?imageName: exactImageName[\s\S]*?\};/,
  let excelSku = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]).trim() : '';
          let existingSku = (itemDetails[itemKey] && itemDetails[itemKey].sku) ? itemDetails[itemKey].sku : '';
          let sku = existingSku || excelSku;
          
          let brand = brandIdx !== -1 && row[brandIdx] ? String(row[brandIdx]).trim() : '';
          let gender = genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]).trim() : 'Unisex';
          let concentration = concIdx !== -1 && row[concIdx] ? String(row[concIdx]).trim() : 'EDP';
          let size = sizeIdx !== -1 && row[sizeIdx] ? String(row[sizeIdx]).trim() : '100ml';
          let scentFamily = famIdx !== -1 && row[famIdx] ? String(row[famIdx]).trim() : 'Floral';
          let topNotes = topIdx !== -1 && row[topIdx] ? String(row[topIdx]).trim() : '';
          let heartNotes = heartIdx !== -1 && row[heartIdx] ? String(row[heartIdx]).trim() : '';
          let baseNotes = baseIdx !== -1 && row[baseIdx] ? String(row[baseIdx]).trim() : '';
          let description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : '';

          let exactImageName = originalName + '.jpg';
          
          if (!newItems.includes(itemKey)) { newItems.push(itemKey); }
          newItemRates[itemKey] = rate;
          newItemDetails[itemKey] = {
              name: itemKey, price: rate, sku: sku, brand: brand, gender: gender, 
              concentration: concentration, size: size, scentFamily: scentFamily, 
              topNotes: topNotes, heartNotes: heartNotes, baseNotes: baseNotes, 
              description: description, imageName: exactImageName
          };
);

fs.writeFileSync('public/admin.html', html);
