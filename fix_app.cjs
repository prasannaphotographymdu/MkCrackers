const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/unsubShop = subscribeShopDetails\(\(liveShop\) => \{\s*if \(liveShop\) \{\s*setShopDetails\(liveShop\);\s*\}\s*\}\);/g, `unsubShop = subscribeShopDetails((liveShop) => {
        if (liveShop) {
          setShopDetails(liveShop);
        }
      }, (err) => {
        console.warn('Firebase Shop details subscription failed', err);
      });`);
      
fs.writeFileSync('src/App.tsx', code);
