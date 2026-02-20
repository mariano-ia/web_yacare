import glob
import re

html_files = glob.glob("/Users/marianonoceti/Desktop/Antigravity/Yacare/**/*.html", recursive=True)

for filepath in html_files:
    if ".agent" in filepath:
        continue

    with open(filepath, "r") as f:
        content = f.read()

    # Logo alt in nav
    content = re.sub(r'alt="Yacaré"\s+class="nav__logo-img"', r'alt="Yacaré - B2B SaaS Product Design Agency Logo" class="nav__logo-img"', content)
    
    # Logo alt in footer
    content = re.sub(r'alt="Yacaré"\s+class="nav__logo-img\s+footer__logo-img"', r'alt="Yacaré - Expert B2B Digital Product Designers" class="nav__logo-img footer__logo-img"', content)
    
    with open(filepath, "w") as f:
        f.write(content)

print("✅ Global logo alt tags updated.")
