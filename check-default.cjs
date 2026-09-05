const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const dbDefault = getFirestore(app, '(default)');

async function run() {
  try {
    const prodsDef = await getDocs(collection(dbDefault, 'products'));
    console.log('DEFAULT DB Products count:', prodsDef.size);
    if (prodsDef.size > 0) {
      console.log('Sample product:', prodsDef.docs[0].data().name);
    }
  } catch (e) {
    console.log('Error reading default DB:', e.message);
  }
}
run().catch(console.error);
