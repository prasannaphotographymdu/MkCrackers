const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const replacement = `export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined | null;
    email: string | undefined | null;
    emailVerified: boolean | undefined | null;
    isAnonymous: boolean | undefined | null;
    tenantId: string | undefined | null;
    providerInfo: any[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}`;

const badRegex = /export interface FirestoreErrorInfo \{[\s\S]*?\}\s*operationType,\s*path\s*\};\s*console\.error\('Firestore Error: ', JSON\.stringify\(errInfo\)\);\s*throw new Error\(JSON\.stringify\(errInfo\)\);\s*\}/m;
code = code.replace(badRegex, replacement);
fs.writeFileSync('src/lib/firebase.ts', code);
