import re
with open('/app/applet/server.ts', 'r') as f:
    content = f.read()

content = content.replace('p.currentStock === 0', '(p.currentStock || 0) === 0')
content = content.replace('p.currentStock > 0', '(p.currentStock || 0) > 0')
content = content.replace('p.currentStock <= p.lowStockLimit', '(p.currentStock || 0) <= (p.lowStockLimit || 5)')
content = content.replace('p.currentStock > p.lowStockLimit', '(p.currentStock || 0) > (p.lowStockLimit || 5)')
content = content.replace('p.currentStock * p.sellingPrice', '(p.currentStock || 0) * (p.sellingPrice || 0)')

with open('/app/applet/server.ts', 'w') as f:
    f.write(content)
