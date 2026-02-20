import os
import re

base_dir = "/Users/marianonoceti/Desktop/Antigravity/Yacare"

updates = {
    "index.html": [
        (r'<h1 class="gradient-text">\s*<span class="sr-only">We design, build, and scale B2B SaaS & digital products\.</span>\s*<span aria-hidden="true">(We build digital<br>experiences\.)</span>\s*</h1>',
         r'<h1 class="gradient-text">\1</h1>')
    ],
    "services/discovery-sprint.html": [
        (r'<span class="sr-only">UX Discovery Sprint: Validate your B2B SaaS Idea</span>\s*<span aria-hidden="true">(Are you building<br>the right thing\?)</span></h1>',
         r'\1</h1>')
    ],
    "services/mvp-jumpstarter.html": [
        (r'<span class="sr-only">MVP Jumpstarter: SaaS Prototyping & App Development</span>\s*<span aria-hidden="true">(Taking too long<br>to launch\?)</span></h1>',
         r'\1</h1>')
    ],
    "services/product-growth.html": [
        (r'<span class="sr-only">Product Growth & UX Optimization Services</span>\s*<span aria-hidden="true">(Product stalling<br>after launch\?)</span></h1>',
         r'\1</h1>')
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
        print(f"Reverted {fpath}")
    else:
        print(f"No changes matched in {fpath}")
