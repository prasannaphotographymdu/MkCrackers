import re
with open('src/components/admin/AdminPortal.tsx', 'r') as f:
    content = f.read()

# Remove loadAllAdminData function definition
content = re.sub(r'const loadAllAdminData = async \(\) => \{[\s\S]*?setIsLoading\(false\);\n    \}\n  \};\n', '', content)
content = re.sub(r'const \[isLoading, setIsLoading\] = useState\(true\);\n', '', content)
content = re.sub(r'loadAllAdminData\(\);\n', '', content)

# Remove the loading screen
loading_ui = r'''  if \(isLoading\) \{
    return \(
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-slate-900 font-sans">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading B2B Admin Console\.\.\.</p>
      </div>
    \);
  \}'''
content = re.sub(loading_ui, '', content)

# Replace the refresh button with a manual fetch or remove it
content = re.sub(r'onClick=\{loadAllAdminData\}', 'onClick={() => {}}', content)

with open('src/components/admin/AdminPortal.tsx', 'w') as f:
    f.write(content)
