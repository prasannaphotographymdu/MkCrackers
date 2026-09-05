import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove fetchShopCatalog function definition
content = re.sub(r'const fetchShopCatalog = async \(\) => \{[\s\S]*?\}\n  \};\n\n', '', content)

# Remove calls to fetchShopCatalog
content = re.sub(r'// Robust API fallback if not compiled yet\n\s*fetchShopCatalog\(\);\n', 'console.log("No catalog found");\n', content)
content = re.sub(r'console\.warn\(\'Firebase lazy load failed:\', err\);\n\s*fetchShopCatalog\(\);\n', 'console.warn(\'Firebase lazy load failed:\', err);\n', content)
content = re.sub(r'if \(targetView === \'shop\'\) fetchShopCatalog\(\);', '', content)
content = re.sub(r'setView\(\'shop\'\);\n\s*fetchShopCatalog\(\);\n', 'setView(\'shop\');\n', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
