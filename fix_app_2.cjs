const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/unsubProds = subscribeProducts\(\(liveProducts\) => \{\s*if \(liveProducts && liveProducts\.length > 0\) \{\s*setProducts\(liveProducts\);\s*\}\s*\}\);/g, `unsubProds = subscribeProducts((liveProducts) => {
          if (liveProducts && liveProducts.length > 0) {
            setProducts(liveProducts);
          }
        }, (err) => console.warn('Firebase Products subscription failed', err));`);
        
code = code.replace(/unsubCats = subscribeCategories\(\(liveCats\) => \{\s*if \(liveCats && liveCats\.length > 0\) \{\s*setCategories\(liveCats\);\s*\}\s*\}\);/g, `unsubCats = subscribeCategories((liveCats) => {
          if (liveCats && liveCats.length > 0) {
            setCategories(liveCats);
          }
        }, (err) => console.warn('Firebase Categories subscription failed', err));`);
        
fs.writeFileSync('src/App.tsx', code);
