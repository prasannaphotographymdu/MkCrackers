const fs = require('fs');
let lines = fs.readFileSync('src/lib/firebase.ts', 'utf8').split('\n');
let newLines = [];
let skip = false;
for (let line of lines) {
  if (line.includes('export const db = initializeFirestore')) {
    newLines.push('export const db = initializeFirestore(app, { ignoreUndefinedProperties: true }, databaseId || undefined);');
    skip = true;
    continue;
  }
  if (skip && line.includes('databaseId || undefined);')) {
    skip = false;
    continue;
  }
  if (!skip) newLines.push(line);
}
fs.writeFileSync('src/lib/firebase.ts', newLines.join('\n'));
