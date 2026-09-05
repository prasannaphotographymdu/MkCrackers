const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const dbNamed = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const catalogRef = doc(dbNamed, 'configs', 'catalog_sku');
    const catalogSnap = await getDoc(catalogRef);
    if (catalogSnap.exists()) {
      console.log('Catalog exists! products:', catalogSnap.data().products.length);
    } else {
      console.log('Catalog DOES NOT exist');
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
