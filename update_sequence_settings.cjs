const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  /export interface SequenceSettings \{([^}]+)\}/,
  (match, p1) => {
    if (!p1.includes('invoicePrefix')) {
      return `export interface SequenceSettings {${p1}  invoicePrefix?: string;\n  invoiceNextNumber?: number;\n  invoiceUseYear?: boolean;\n  invoicePadding?: number;\n}`;
    }
    return match;
  }
);
fs.writeFileSync('src/types.ts', code);
