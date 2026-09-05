const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
code = code.replace(/import { initializeApp, getApps, getApp } from 'firebase\/app';/g, "import { initializeApp, getApps, getApp } from 'firebase/app';\nimport { getAuth } from 'firebase/auth';");
code = code.replace(/export const db = initializeFirestore/g, "export const auth = getAuth(app);\nexport const db = initializeFirestore");
fs.writeFileSync('src/lib/firebase.ts', code);
