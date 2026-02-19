import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove style="padding: 0 0 var(--space-8) 0; margin-top: var(--space-8);" and similar
    # from section tags or divs entirely.
    # Actually, let's just use Python's replace
    new_content = re.sub(r'\s*style="padding:[^"]+"', '', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('.'):
    if 'node_modules' in root or 'dist' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
