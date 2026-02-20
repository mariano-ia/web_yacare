import os

def fix_html_files():
    for root, _, files in os.walk('.'):
        if 'node_modules' in root or 'dist' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for double meta tags
                old_double_meta = '<meta name="color-scheme" content="dark">\n  <meta name="color-scheme" content="dark">'
                if old_double_meta in content:
                    content = content.replace(old_double_meta, '<meta name="color-scheme" content="dark">')
                
                old_style = 'html, body { background-color: #08080c; color: #ffffff; }'
                new_style = 'html, body { background-color: #08080c; color: #ffffff; margin: 0; padding: 0; }'
                if old_style in content:
                    content = content.replace(old_style, new_style)
                    print(f"Updated margins in {filepath}")
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

fix_html_files()
