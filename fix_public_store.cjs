const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  // Always use live subscriptions for both admin and public to ensure real-time accuracy and bypass the 1MB catalog limit
  useEffect(() => {
    let unsubProds = () => {};
    let unsubCats = () => {};

    import('./lib/firebase').then(({ subscribeProducts, subscribeCategories }) => {
      unsubProds = subscribeProducts((liveProducts) => {
        if (liveProducts) {
          setProducts(liveProducts);
        }
      }, (err) => console.warn('Firebase Products subscription failed', err));
      unsubCats = subscribeCategories((liveCats) => {
        if (liveCats) {
          setCategories(liveCats);
        }
      }, (err) => console.warn('Firebase Categories subscription failed', err));
    }).catch(err => console.warn('Firebase lazy load failed:', err));

    return () => {
      unsubProds();
      unsubCats();
    };
  }, []);`;

const badRegex = /\/\/ Optimized Dynamic Live Subscriptions vs Static Cached Catalog\s*useEffect\(\(\) => \{[\s\S]*?\}, \[view\]\);/;
code = code.replace(badRegex, replacement);
fs.writeFileSync('src/App.tsx', code);
