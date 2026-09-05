import re
with open('/app/applet/src/components/admin/OfflineOrdersView.tsx', 'r') as f:
    content = f.read()

content = content.replace('order.billNumber.toLowerCase()', '(order.billNumber || "").toLowerCase()')
content = content.replace('order.items.reduce', '(order.items || []).reduce')
content = content.replace('order.items.map', '(order.items || []).map')

with open('/app/applet/src/components/admin/OfflineOrdersView.tsx', 'w') as f:
    f.write(content)
