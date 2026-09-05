const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const prods = await getDocs(collection(db, 'products'));
  console.log('Products count:', prods.size);
  prods.forEach(d => console.log(d.id, d.data().name));
}
run().catch(console.error);
