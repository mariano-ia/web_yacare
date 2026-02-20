import os
import re

critical_style = """<meta name="color-scheme" content="dark">
    <style>
        html, body { background-color: #08080c; color: #ffffff; }
        .nav__logo-img { height: 28px; width: auto; }
    </style>"""

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Add color-scheme and style to head if missing (or replace existing <style>html,body{background-color:#000;}</style>)
    if 'html,body{background-color:#000;}' in content:
        content = content.replace('<meta name="color-scheme" content="dark">\n    <style>html,body{background-color:#000;}</style>', critical_style)
        content = content.replace('<style>html,body{background-color:#000;}</style>', critical_style)
        modified = True
    elif 'color-scheme' not in content:
        # insert after viewport
        viewport_tag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        if viewport_tag in content:
            content = content.replace(viewport_tag, viewport_tag + '\n    ' + critical_style)
            modified = True

    # 2. Add inline style to nav logo
    logo_tag_old = '<img src="/logo_yacare.svg" alt="Yacaré" class="nav__logo-img" />'
    logo_tag_new = '<img src="/logo_yacare.svg" alt="Yacaré" class="nav__logo-img" style="height: 28px; width: auto;" />'
    if logo_tag_old in content:
        content = content.replace(logo_tag_old, logo_tag_new)
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('.'):
    if 'node_modules' in root or 'dist' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
