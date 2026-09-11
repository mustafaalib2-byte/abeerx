const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// Find the importItemsExcel function
const startTag = 'function importItemsExcel(e) {';
const endTag = '} // end importItemsExcel'; // Wait, let's just do a regex replace for the parsing logic

const regex = /let skuIdx\s*=\s*getIdx\(\['sku'\]\);[\s\S]*?if \(!newItems.includes\(itemKey\)\) \{ newItems\.push\(itemKey\); \}\s*newItemRates\[itemKey\] = rate;\s*newItemDetails\[itemKey\] = \{[\s\S]*?\};\s*\}/g;

const newLogic = `
        let skuIdx    = getIdx(['sku']); 
        let itemIdx   = getIdx(['item']); 
        let genderIdx = getIdx(['gender']);
        let concIdx   = getIdx(['concentration']);
        let sizeIdx   = getIdx(['size', 'volume']);
        let catIdx    = getIdx(['category']);
        let famIdx    = getIdx(['scent family', 'family']);
        let accordIdx = getIdx(['main accord', 'accord']);
        let topIdx    = getIdx(['top notes']);
        let heartIdx  = getIdx(['heart notes']);
        let baseIdx   = getIdx(['base notes']);
        let occIdx    = getIdx(['occasion']);
        let originIdx = getIdx(['country', 'origin']);
        let rateIdx   = getIdx(['sale price', 'sale rate', 'rate', 'price']);
        let brandIdx  = getIdx(['brand']);
        let descIdx   = getIdx(['description']);

        if (itemIdx === -1) { hideLoading(); toast('❌ Could not find "Item" column.'); return; }
        let nameIdxToUse = itemIdx;

        let newItems = []; let newItemRates = {}; let newItemDetails = {}; 
        
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i]; if (!row || row.length === 0) continue;
          let originalName = String(row[nameIdxToUse] || '').trim(); 
          let itemKey = originalName.replace(/\\./g, '․').replace(/[#$\\[\\]\\/\\n\\r]/g, '-').trim(); 
          
          if (!itemKey) continue; 
          
          let rawRate = row[rateIdx]; let rate = parseFloat(rawRate); if (isNaN(rate)) rate = 0.00;
          
          let excelSku = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]).trim() : '';
          let existingSku = (itemDetails[itemKey] && itemDetails[itemKey].sku) ? itemDetails[itemKey].sku : '';
          let sku = existingSku || excelSku;
          
          let brand = brandIdx !== -1 && row[brandIdx] ? String(row[brandIdx]).trim() : '';
          let gender = genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]).trim() : 'Unisex';
          let concentration = concIdx !== -1 && row[concIdx] ? String(row[concIdx]).trim() : 'EDP';
          let size = sizeIdx !== -1 && row[sizeIdx] ? String(row[sizeIdx]).trim() : '100ml';
          let category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : 'Perfume';
          let scentFamily = famIdx !== -1 && row[famIdx] ? String(row[famIdx]).trim() : 'Floral';
          let mainAccord = accordIdx !== -1 && row[accordIdx] ? String(row[accordIdx]).trim() : '';
          let topNotes = topIdx !== -1 && row[topIdx] ? String(row[topIdx]).trim() : '';
          let heartNotes = heartIdx !== -1 && row[heartIdx] ? String(row[heartIdx]).trim() : '';
          let baseNotes = baseIdx !== -1 && row[baseIdx] ? String(row[baseIdx]).trim() : '';
          let occasion = occIdx !== -1 && row[occIdx] ? String(row[occIdx]).trim() : '';
          let origin = originIdx !== -1 && row[originIdx] ? String(row[originIdx]).trim() : '';
          let description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : '';

          // Auto image logic
          let exactImageName = originalName + '.jpg';
          
          if (!newItems.includes(itemKey)) { newItems.push(itemKey); }
          newItemRates[itemKey] = rate;
          newItemDetails[itemKey] = { 
              name: itemKey, price: rate, sku: sku, brand: brand, gender: gender, 
              concentration: concentration, size: size, category: category, scentFamily: scentFamily, mainAccord: mainAccord,
              topNotes: topNotes, heartNotes: heartNotes, baseNotes: baseNotes, occasion: occasion, origin: origin,
              description: description, imageName: exactImageName 
          };
        }
`;

html = html.replace(regex, newLogic.trim());
fs.writeFileSync('public/admin.html', html);
console.log("Successfully replaced the POS logic");
