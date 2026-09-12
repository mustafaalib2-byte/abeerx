const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const newJs = \
  function populateProductImageDropdown() {
      const sel = document.getElementById('product-image-select');
      if (!sel) return;
      sel.innerHTML = '<option value="">-- Select a Perfume --</option>';
      items.forEach(i => {
          sel.innerHTML += '<option value="' + escH(i) + '">' + escH(i) + '</option>';
      });
  }

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
              const base64Str = canvas.toDataURL('image/jpeg', 0.85);
              
              dbRef.child('abeerx/productImages/' + itemName).set(base64Str).then(() => {
                  hideLoading(); toast('? Image synced to website!');
              }).catch(err => { hideLoading(); toast('? Error uploading image.'); });
          }
          img.onerror = function() { hideLoading(); toast('? Invalid image format.'); }
          img.src = e.target.result;
      };
      reader.readAsDataURL(file);
  }

  function uploadCustomLabelImage\;

html = html.replace('function uploadCustomLabelImage', newJs);

const renderInjection = \originalRenderItemsList(); populateProductImageDropdown();\;
html = html.replace(/renderItemsList\\(\\) \\{[\\s\\S]*?originalRenderItemsList\\(\\);/, \unction renderItemsList() { originalRenderItemsList();\); // Wait, does originalRenderItemsList exist?

fs.writeFileSync('public/admin.html', html);
