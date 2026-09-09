const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `      console.log('Public mode: Reading optimized static SKU catalog from configs/catalog_sku');
      import('./lib/firebase').then(({ fetchStaticSKUCatalog }) => {
        fetchStaticSKUCatalog().then((cached) => {
          if (cached && cached.products && cached.products.length > 0) {
            setProducts(cached.products);
            setCategories(cached.categories);
          } else {
            console.log("No catalog found in Firebase, falling back to REST API");
            fetch('/api/products').then(res => res.json()).then(data => {
              if (data && data.length > 0) setProducts(data);
            }).catch(err => console.warn('REST Products fetch failed', err));
            
            fetch('/api/categories').then(res => res.json()).then(data => {
              if (data && data.length > 0) setCategories(data);
            }).catch(err => console.warn('REST Categories fetch failed', err));
          }
        });
      }).catch(err => {
        console.warn('Firebase lazy load failed:', err);
      });`;

const badRegex = /console\.log\('Public mode: Reading optimized static SKU catalog from configs\/catalog_sku'\);\s*import\('\.\/lib\/firebase'\)\.then\(\(\{ fetchStaticSKUCatalog \}\) => \{\s*fetchStaticSKUCatalog\(\)\.then\(\(cached\) => \{\s*if \(cached && cached\.products && cached\.products\.length > 0\) \{\s*setProducts\(cached\.products\);\s*setCategories\(cached\.categories\);\s*\} else \{\s*console\.log\("No catalog found"\);\s*\}\s*\}\);\s*\}\)\.catch\(err => \{\s*console\.warn\('Firebase lazy load failed:', err\);\s*\}\);/m;
code = code.replace(badRegex, replacement);
fs.writeFileSync('src/App.tsx', code);
