const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
async function run() {
  await signInWithEmailAndPassword(auth, 'admin@mkcrackers.in', 'Mkadmin@123').catch(e => {
    return signInWithEmailAndPassword(auth, 'admin@mkcrackers.in', 'MkCrackers@2026');
  });
  console.log('Signed in!');
  const prods = await getDocs(collection(db, 'products'));
  console.log('Products count:', prods.size);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
