const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    const productsList = [];
    prodSnap.forEach((docSnap) => {
      const p = docSnap.data();
      if (p.status === 'active') {
        productsList.push({ id: docSnap.id, ...p });
      }
    });

    const catSnap = await getDocs(collection(db, 'categories'));
    const categoriesList = [];
    catSnap.forEach((docSnap) => {
      categoriesList.push({ id: docSnap.id, ...docSnap.data() });
    });
    categoriesList.sort((a, b) => a.displayOrder - b.displayOrder);

    const catalogRef = doc(db, 'configs', 'catalog_sku');
    await setDoc(catalogRef, {
      products: productsList,
      categories: categoriesList,
      lastUpdated: new Date().toISOString(),
      isStale: false
    });
    console.log('Catalog updated successfully. Products:', productsList.length);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
