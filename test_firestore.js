import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

if (process.env.NODE_ENV !== 'production') {
  process.env.GCE_METADATA_HOST = "127.0.0.1:9999";
}

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'products'));
    console.log("Read success! Count:", snap.size);
  } catch (err) {
    console.error("Read failed:", err.message);
  }
}
run().catch(console.error);
