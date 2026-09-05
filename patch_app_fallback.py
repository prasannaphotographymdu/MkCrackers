import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('// Fallback REST API initial fetch\n    fetchShopInfo();', '')
content = content.replace('console.warn(\'Falling back to Firestore snapshot...\');', 'console.warn(\'Error fetching catalog\', err);')

with open('src/App.tsx', 'w') as f:
    f.write(content)
