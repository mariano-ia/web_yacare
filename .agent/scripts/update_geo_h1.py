import os
import re

base_dir = "/Users/marianonoceti/Desktop/Antigravity/Yacare"

updates = {
    "services/discovery-sprint.html": [
        (r'(<h1[^>]*>)\s*(Are you building<br>the right thing\?)\s*</h1>',
         r'\1\n                    <span class="sr-only">UX Discovery Sprint: Validate your B2B SaaS Idea</span>\n                    <span aria-hidden="true">\2</span></h1>')
    ],
    "services/mvp-jumpstarter.html": [
        (r'(<h1[^>]*>)\s*(Taking too long<br>to launch\?)\s*</h1>',
         r'\1\n                    <span class="sr-only">MVP Jumpstarter: SaaS Prototyping & App Development</span>\n                    <span aria-hidden="true">\2</span></h1>')
    ],
    "services/product-growth.html": [
        (r'(<h1[^>]*>)\s*(Product stalling<br>after launch\?)\s*</h1>',
         r'\1\n                    <span class="sr-only">Product Growth & UX Optimization Services</span>\n                    <span aria-hidden="true">\2</span></h1>')
    ]
}

for file_rel, rules in updates.items():
    fpath = os.path.join(base_dir, file_rel)
    if not os.path.exists(fpath):
        print(f"File {fpath} not found")
        continue

    with open(fpath, "r") as f:
        content = f.read()

    original = content
    for pattern, replacement in rules:
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    if original != content:
        with open(fpath, "w") as f:
            f.write(content)
        print(f"Updated {fpath}")
    else:
        print(f"No changes matched in {fpath}")
