const ExcelJS = require('exceljs');

async function createTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ABEERX Catalog');

    // Define columns
    sheet.columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Item', key: 'item', width: 30 },
        { header: 'Brand', key: 'brand', width: 15 },
        { header: 'Sale Price', key: 'price', width: 15 },
        { header: 'Gender', key: 'gender', width: 15 },
        { header: 'Concentration', key: 'concentration', width: 15 },
        { header: 'Size', key: 'size', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Scent Family', key: 'family', width: 20 },
        { header: 'Main Accord', key: 'accord', width: 20 },
        { header: 'Top Notes', key: 'top', width: 25 },
        { header: 'Heart Notes', key: 'heart', width: 25 },
        { header: 'Base Notes', key: 'base', width: 25 },
        { header: 'Occasion', key: 'occasion', width: 20 },
        { header: 'Country of Origin', key: 'origin', width: 20 },
        { header: 'Description', key: 'desc', width: 40 }
    ];

    // Style headers
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }; // Black background
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add sample data
    sheet.addRow({
        sku: 'ABX-001', item: 'Royal Oud', brand: 'ABEERX', price: 45.000, gender: 'Unisex',
        concentration: 'EDP', size: '100ml', category: 'Perfume', family: 'Woody', accord: 'Woody-Spicy',
        top: 'Pink Pepper, Bergamot', heart: 'Rose, Jasmine', base: 'Oud, Amber, Vanilla', occasion: 'Evening, Winter',
        origin: 'UAE', desc: 'A rich Cambodian oud experience.'
    });

    sheet.addRow({
        sku: 'ABX-002', item: 'Velvet Musk', brand: 'Faiz', price: 25.500, gender: 'Women',
        concentration: 'Hair Mist', size: '50ml', category: 'Hair Mist', family: 'Floral', accord: 'White Floral',
        top: 'Lemon, Mandarin', heart: 'Lily of the Valley', base: 'White Musk, Sandalwood', occasion: 'Daily, Summer',
        origin: 'France', desc: 'Soft, powdery musk for daily wear.'
    });

    // Add Data Validation
    const genderList = '"Men,Women,Unisex"';
    const concList = '"EDP,EDT,Parfum,Extrait,Oil,Hair Mist,Body Lotion,Room Spray"';
    const sizeList = '"30ml,50ml,100ml,200ml,1 Tola,1/2 Tola,1/4 Tola"';
    const catList = '"Perfume,Hair Mist,Oud Oil,Home Fragrance,Gift Set,Body Care"';
    const familyList = '"Citrus,Aromatic,Light Floral,Intense Floral,Woody,Soft Ambery,Rich Ambery,Amber,Floral,Oriental,Fresh"';
    const occList = '"Daily,Evening,Office,Wedding,Winter,Summer,All Seasons"';

    for (let i = 2; i <= 2000; i++) {
        sheet.getCell(`E${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [genderList] };
        sheet.getCell(`F${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [concList] };
        sheet.getCell(`G${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [sizeList] };
        sheet.getCell(`H${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [catList] };
        sheet.getCell(`I${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [familyList] };
    }

    await workbook.xlsx.writeFile('public/ABEERX_Perfume_Catalog_Template.xlsx');
    console.log("Template generated successfully!");
}

createTemplate().catch(console.error);
