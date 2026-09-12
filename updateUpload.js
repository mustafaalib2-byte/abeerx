const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const injectionPoint = 'Choose Excel File to Overwrite Database';
const newCard = \Choose Excel File to Overwrite Database
          <input type="file" id="excel-uploader" style="display:none;" accept=".xlsx, .xls, .csv" onchange="importItemsExcel(event)">
        </label>
      </div>

      <div class="card" style="border-left: 5px solid #2196F3;">
        <div class="card-title">??? Upload Product Images</div>
        <p style="font-size:0.9rem; color:var(--muted); margin-bottom:15px; line-height:1.5;">
          Select an item from your catalog and upload its image. This image will instantly sync to your live Website!
        </p>
        <div style="display:flex; gap:15px; align-items:center;">
          <select id="product-image-select" class="input" style="flex:2;">
            <option value="">-- Select a Perfume --</option>
          </select>
          <label class="btn btn-outline" style="flex:1; cursor:pointer; text-align:center; border-color:#2196F3; color:#2196F3;">
            ?? Upload Image
            <input type="file" style="display:none;" accept="image/*" onchange="uploadProductImage(event)">
          </label>
        </div>
      </div>\;

html = html.replace(/Choose Excel File to Overwrite Database[\\s\\S]*?<input type="file" id="excel-uploader"[\\s\\S]*?onchange="importItemsExcel\\(event\\)">[\\s\\S]*?<\\/label>[\\s\\S]*?<\\/div>/, newCard);

const jsInjectionPoint = 'function saveImageToCloud';
const newJs = \
// Populate the product image dropdown
function populateProductImageDropdown() {
    const sel = document.getElementById('product-image-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select a Perfume --</option>';
    items.forEach(i => {
        sel.innerHTML += '<option value="' + i + '">' + i + '</option>';
    });
}
// Call this whenever items change
const originalRenderItemsList = renderItemsList;
renderItemsList = function() {
    originalRenderItemsList();
    populateProductImageDropdown();
};

function uploadProductImage(event) {
    if (!isAdmin) return toast('? Must be logged in as Admin.');
    const itemName = document.getElementById('product-image-select').value;
    if (!itemName) return toast('? Please select a perfume first!');
    
    const file = event.target.files[0];
    if (!file) return;
    
    showLoading('Optimizing and uploading product image...');
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600; 
            let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const base64Str = canvas.toDataURL('image/jpeg', 0.85); // JPEG for better product compression
            
            dbRef.child('abeerx/productImages/' + itemName).set(base64Str).then(() => {
                hideLoading(); toast('? Image synced to website!');
            }).catch(err => { hideLoading(); toast('? Error uploading image.'); });
        }
        img.onerror = function() { hideLoading(); toast('? Invalid image format.'); }
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function saveImageToCloud\;

html = html.replace('function saveImageToCloud', newJs);
fs.writeFileSync('public/admin.html', html);
console.log('Successfully injected product image uploader');
