process.env.GCE_METADATA_HOST = "127.0.0.1:9999";
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.GCLOUD_PROJECT;
delete process.env.GCP_PROJECT;

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'products', 'test-1'), { name: 'Test Product' });
    await batch.commit();
    console.log('Seed success');
  } catch(e) {
    console.error('Seed failed:', e);
  }
}
test();
