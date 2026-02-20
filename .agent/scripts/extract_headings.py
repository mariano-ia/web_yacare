import re
import os

files_to_check = [
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/index.html",
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/services/discovery-sprint.html",
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/services/mvp-jumpstarter.html",
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/services/product-growth.html"
]

for filepath in files_to_check:
    if not os.path.exists(filepath):
        continue
    
    print(f"\n--- Checking Headings for: {os.path.basename(filepath)} ---")
    with open(filepath, 'r') as f:
        # We process manually to get raw text with a simple regex or use beautifulsoup if available. 
        # Using a simple regex approach that handles basic multiline.
        content = f.read()
        
    # Find all h1, h2, h3 tags
    headings = re.findall(r'<(h[1-3])[^>]*>(.*?)</\1>', content, re.IGNORECASE | re.DOTALL)
    
    for tag_name, text in headings:
        # Clean up text (remove inner tags, newlines, etc.)
        clean_text = re.sub(r'<[^>]+>', '', text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        indent = "  " * (int(tag_name[1]) - 1)
        print(f"{indent}<{tag_name.lower()}>: {clean_text}")
