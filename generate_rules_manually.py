import json

with open("firebase-blueprint.json", "r") as f:
    bp = json.load(f)

rules = """rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function incoming() { return request.resource.data; }
    function existing() { return resource.data; }
    function isValidId(id) { return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$'); }
    function isAdmin() { return isSignedIn() && request.auth.token.email == "prasannaphotographymdu@gmail.com"; }
"""

for entity_name, entity in bp["entities"].items():
    rules += f"\n    function isValid{entity_name.capitalize()}(data) {{\n"
    rules += f"      return data.keys().size() > 0"
    for prop, prop_def in entity["properties"].items():
        type_map = {"string": "string", "number": "number", "boolean": "bool"}
        fb_type = type_map.get(prop_def["type"].split(" ")[0], "string")
        rules += f" && (!('{prop}' in data) || data.{prop} is {fb_type})"
    rules += ";\n    }\n"

rules += """
    match /{document=**} {
      allow read, write: if false;
    }
"""

for collection in bp["entities"].keys():
    rules += f"""
    match /{collection}/{{docId}} {{
      allow read: if true;
      allow create: if isValidId(docId) && isValid{collection.capitalize()}(incoming());
      allow update: if isValidId(docId) && isValid{collection.capitalize()}(incoming());
      allow delete: if isAdmin();
    }}
"""

rules += "  }\n}\n"

with open("firestore.rules", "w") as f:
    f.write(rules)
