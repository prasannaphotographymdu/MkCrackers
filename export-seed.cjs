const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

async function exportData() {
  console.log("Exporting categories...");
  const catSnap = await getDocs(collection(db, 'categories'));
  const categories = [];
  catSnap.forEach(doc => categories.push({ id: doc.id, ...doc.data() }));

  console.log("Exporting products...");
  const prodSnap = await getDocs(collection(db, 'products'));
  const products = [];
  prodSnap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
  
  // Update seed.ts
  let seedCode = fs.readFileSync('./src/data/seed.ts', 'utf8');
  
  // Replace INITIAL_CATEGORIES
  const catRegex = /export const INITIAL_CATEGORIES: Category\[\] = \[[\s\S]*?\];/;
  const newCatStr = `export const INITIAL_CATEGORIES: Category[] = ${JSON.stringify(categories, null, 2)};`;
  seedCode = seedCode.replace(catRegex, newCatStr);
  
  // Replace INITIAL_PRODUCTS
  const prodRegex = /export const INITIAL_PRODUCTS: Product\[\] = \[[\s\S]*?\];/;
  const newProdStr = `export const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};`;
  seedCode = seedCode.replace(prodRegex, newProdStr);

  fs.writeFileSync('./src/data/seed.ts', seedCode);
  console.log("seed.ts successfully updated with live data!");
}

exportData().catch(console.error);
