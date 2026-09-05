import re
with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace('await seedFirestoreIfEmpty();', 'await seedFirestoreIfEmpty();\n    syncFromFirestore();')

with open('server.ts', 'w') as f:
    f.write(content)
