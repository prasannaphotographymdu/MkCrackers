const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = getFirestore(app);
async function run() {
  const prods = await getDocs(collection(db, 'test'));
  console.log('test count:', prods.size);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
