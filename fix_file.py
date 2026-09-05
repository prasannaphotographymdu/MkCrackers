with open('src/lib/firebase.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.strip() == ");" and lines[i+1].strip() == "}":
        if i > 0 and lines[i-1].strip() == "}":
            # This is an extra );\n} right after a valid one
            continue
    new_lines.append(line)

final_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if line.strip() == ");" and i+1 < len(lines) and lines[i+1].strip() == "}":
        if i-1 >= 0 and lines[i-1].strip() == "}":
            i += 2
            continue
    final_lines.append(line)
    i += 1

with open('src/lib/firebase.ts', 'w') as f:
    f.write("".join(final_lines))

