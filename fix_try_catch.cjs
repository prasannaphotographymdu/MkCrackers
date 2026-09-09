const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const regex = /if \(err\.message\?\.includes\('Missing or insufficient permissions'\)\) \{\s*handleFirestoreError\(err, (.*?), (.*?)\);\s*\}/g;
code = code.replace(regex, `try {
        if (err.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, $1, $2);
        }
      } catch (e) {
        if (onError) onError(e);
      }`);

fs.writeFileSync('src/lib/firebase.ts', code);
