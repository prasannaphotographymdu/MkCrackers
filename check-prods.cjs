const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const dbNamed = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const prods = await getDocs(collection(dbNamed, 'products'));
    console.log('Products count:', prods.size);
    if (prods.size > 27) {
      console.log('EXTRA DATA EXISTS');
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
