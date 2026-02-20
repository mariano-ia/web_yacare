import os
import re

standard_nav = """<div class="nav__links">
                <a href="/" class="nav__link">Home</a>
                <a href="/services.html" class="nav__link">Services</a>
                <a href="/work.html" class="nav__link">Work</a>
                <a href="/about.html" class="nav__link">About</a>
                <a href="/contact.html" class="btn btn--primary nav__cta"><span>Let's Talk</span></a>
            </div>"""

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Search for exactly <div class="nav__links"> and the closing </div>
    pattern = re.compile(r'<div class="nav__links">.*?</div>', re.DOTALL)
    
    if pattern.search(content):
        # We also need to extract active class to apply it to standard nav
        # Or no, user said "exactamente la misma", I will blindly replace it.
        new_content, count = pattern.subn(standard_nav, content)
        if count > 0 and new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")

for root, _, files in os.walk('.'):
    if 'node_modules' in root or 'dist' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
