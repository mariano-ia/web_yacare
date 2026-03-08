import re

html_file = 'work/sameco.html'
with open(html_file, 'r', encoding='utf-8') as f:
    html = f.read()

new_content = re.sub(
    r'<video[^>]*>[\s\S]*?</video>',
    '<img src="/assets/videos/sameco_animation.webp" alt="SAMECO Dashboard Animation" style="width: 100%; height: 100%; object-fit: cover; display: block;">',
    html
)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated HTML to use .webp format")
