import re
with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

# Replace the fallback logic with just a console.error in subscribe methods
for collection in ['Products', 'Categories', 'Enquiries', 'Invoices', 'OfflineOrders', 'StockOutNotifications', 'ShopDetails']:
    regex = r"\(err\) => \{[^}]*console\.warn\('Firestore .*? read restricted, using REST API fallback:', err\.message\);.*?catch\(\(\) => \{\}\);\s*\}"
    replacement = r"""(err) => {
      console.error('Firestore read error:', err.message);
      if (onError) onError(err);
    }"""
    content = re.sub(regex, replacement, content, flags=re.DOTALL)

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
