with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

# Replace the first definition (the one we injected)
import re
content = re.sub(r'export function subscribeStockOutNotifications\(\n\s*callback: \(notifications: any\[\]\) => void,\n\s*onError\?: \(err: any\) => void\n\) \{\n\s*return onSnapshot\(\n\s*query\(collection\(db, \'stockOutNotifications\'\), orderBy\(\'createdAt\', \'desc\'\), limit\(50\)\),\n\s*\(snapshot\) => \{\n\s*const notifs: any\[\] = \[\];\n\s*snapshot\.forEach\(\(doc\) => notifs\.push\(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\);\n\s*callback\(notifs\);\n\s*\},\n\s*\(err\) => \{ console\.error\(\'Firestore read error:\', err\.message\); if\(onError\) onError\(err\); \}\n\s*\);\n\}', '', content)

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
