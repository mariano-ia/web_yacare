import os
import re

schema_json_ld = """
    <!-- JSON-LD for Search Engines & LLMs (GEO/AIO) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Yacaré",
      "url": "https://yacare.design",
      "description": "Boutique UX Factory and Product Design Agency specializing in B2B SaaS, MVPs, and digital product growth.",
      "keywords": "UX Design, UI Design, Product Design, B2B SaaS, MVP Development, Product Growth, UX Research",
      "knowsAbout": [
        "User Experience Design",
        "User Interface Design",
        "B2B SaaS Product Design",
        "MVP Jumpstarter",
        "Product Growth Engineering",
        "Discovery Sprints"
      ],
      "sameAs": [
        "https://www.linkedin.com/company/yacare-design"
      ],
      "areaServed": "Worldwide",
      "slogan": "We design, build, and scale SaaS, digital products, and MVPs that actually impact your bottom line."
    }
    </script>
"""

def inject_schema(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Check if already has JSON-LD
    if 'application/ld+json' in content:
        print(f"Schema already exists in {filepath}. Skipping.")
        return
        
    # Insert before closing head tag
    new_content = re.sub(r'</head>', f'{schema_json_ld}\n</head>', content, count=1)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    print(f"Injected JSON-LD Schema into {filepath}")

if __name__ == "__main__":
    html_files = [
        "/Users/marianonoceti/Desktop/Antigravity/Yacare/index.html",
        "/Users/marianonoceti/Desktop/Antigravity/Yacare/services.html",
        "/Users/marianonoceti/Desktop/Antigravity/Yacare/about.html"
    ]
    for p in html_files:
        inject_schema(p)
