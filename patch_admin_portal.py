import re
with open('/app/applet/src/components/admin/AdminPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace('p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)', 'p.currentStock > 0 && p.currentStock <= (p.lowStockLimit || 5)')
content = content.replace('p.stock === 0', 'p.currentStock === 0')
content = content.replace('p.stock * p.sellingPrice', 'p.currentStock * p.sellingPrice')

with open('/app/applet/src/components/admin/AdminPortal.tsx', 'w') as f:
    f.write(content)
