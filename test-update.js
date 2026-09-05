import fetch from 'node-fetch';
const base64 = 'data:image/jpeg;base64,' + 'A'.repeat(50000);
fetch('http://localhost:3000/api/products/prod-101', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64, sku: 'TEST-101' })
}).then(res => res.json()).then(console.log).catch(console.error);
