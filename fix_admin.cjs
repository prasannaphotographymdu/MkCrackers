const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPortal.tsx', 'utf8');

code = code.replace(/const unsubProds = subscribeProducts\(\(liveProds\) => setProducts\(liveProds\)\);/g, "const unsubProds = subscribeProducts((liveProds) => setProducts(liveProds), (err) => console.warn(err));");
code = code.replace(/const unsubCats = subscribeCategories\(\(liveCats\) => setCategories\(liveCats\)\);/g, "const unsubCats = subscribeCategories((liveCats) => setCategories(liveCats), (err) => console.warn(err));");
code = code.replace(/const unsubEnqs = subscribeEnquiries\(\(liveEnqs\) => setEnquiries\(liveEnqs\)\);/g, "const unsubEnqs = subscribeEnquiries((liveEnqs) => setEnquiries(liveEnqs), (err) => console.warn(err));");
code = code.replace(/const unsubInvs = subscribeInvoices\(\(liveInvs\) => setInvoices\(liveInvs\)\);/g, "const unsubInvs = subscribeInvoices((liveInvs) => setInvoices(liveInvs), (err) => console.warn(err));");
code = code.replace(/const unsubOffline = subscribeOfflineOrders\(\(liveOrders\) => setOfflineOrders\(liveOrders\)\);/g, "const unsubOffline = subscribeOfflineOrders((liveOrders) => setOfflineOrders(liveOrders), (err) => console.warn(err));");

fs.writeFileSync('src/components/admin/AdminPortal.tsx', code);
