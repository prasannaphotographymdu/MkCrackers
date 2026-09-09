import re
with open('/app/applet/src/components/admin/POSReceiptModal.tsx', 'r') as f:
    content = f.read()

content = content.replace('order.items.map', '(order.items || []).map')
content = content.replace('order.items.reduce', '(order.items || []).reduce')

with open('/app/applet/src/components/admin/POSReceiptModal.tsx', 'w') as f:
    f.write(content)
