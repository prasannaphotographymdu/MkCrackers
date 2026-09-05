const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const dbNamed = getFirestore(app, config.firestoreDatabaseId);
const dbDefault = getFirestore(app);

async function run() {
  try {
    const prodsNamed = await getDocs(collection(dbNamed, 'products'));
    console.log('NAMED DB (', config.firestoreDatabaseId, ') Products count:', prodsNamed.size);
  } catch (e) {
    console.log('Error reading named DB:', e.message);
  }

  try {
    const prodsDef = await getDocs(collection(dbDefault, 'products'));
    console.log('DEFAULT DB Products count:', prodsDef.size);
    if (prodsDef.size > 0) {
      prodsDef.forEach(d => console.log(' Default DB:', d.id, d.data().name));
    }
    process.exit(0);
  } catch (e) {
    console.log('Error reading default DB:', e.message);
    process.exit(1);
  }
}
run().catch(console.error);
