import re

filepath = "/Users/marianonoceti/Desktop/Antigravity/Yacare/index.html"

replacements = {
    r'alt="Yacaré" class="nav__logo-img"': r'alt="Yacaré - B2B SaaS Product Design Agency Logo" class="nav__logo-img"',
    r'alt="Yacaré" class="nav__logo-img footer__logo-img"': r'alt="Yacaré Agency - Expert B2B Digital Product Designers" class="nav__logo-img footer__logo-img"',
    r'alt="Nawaiam"': r'alt="Nawaiam UI Showcase - Gamified Recruitment Mobile App Design by Yacaré"',
    r'alt="Pharma Lab"': r'alt="Pharma Lab Dashboard - B2B Medical Data Analytics UI Design"',
    r'alt="FinTech App"': r'alt="FinTech Mobile Banking App Interface - Digital Product Design by Yacaré"',
    r'alt="EdTech Hub"': r'alt="EdTech Hub LMS Platform - Skill-based Education UX Redesign"',
    r'alt="ShopStream"': r'alt="ShopStream E-commerce AI Assistant - High Conversion Retail App Design"',
    r'alt="NeuroCloud"': r'alt="NeuroCloud Cloud Management Dashboard - B2B Enterprise UI/UX"'
}

with open(filepath, "r") as f:
    content = f.read()

for old_str, new_str in replacements.items():
    content = re.sub(old_str, new_str, content)

with open(filepath, "w") as f:
    f.write(content)

print("✅ Image alt attributes securely updated for SEO.")
