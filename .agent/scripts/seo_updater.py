import glob
import re
import os

files_to_update = {
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/index.html": {
        "title": "<title>Yacaré | B2B Digital Product Design Agency & UX Factory</title>",
        "desc": "<meta name=\"description\"\n    content=\"Boutique UX Factory and Product Design Agency. We design, build, and scale SaaS, digital products, and MVPs that actually impact your bottom line.\">"
    },
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/services.html": {
        "title": "<title>Digital Product Design Services: Discovery, MVP & Growth — Yacaré</title>",
        "desc": "<meta name=\"description\"\n    content=\"Boutique UX Factory and Product Design Agency. We design, build, and scale SaaS, digital products, and MVPs that actually impact your bottom line.\">"
    },
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/work.html": {
        "title": "<title>Portfolio & Case Studies: B2B SaaS & Digital Products — Yacaré</title>",
        "desc": "<meta name=\"description\"\n    content=\"Explore our portfolio of B2B SaaS, fintech, and enterprise apps. See how Yacaré's product design and UX research methodologies drive business growth.\">"
    },
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/about.html": {
        "title": "<title>About Yacaré: Boutique UX Factory & Product Design Agency</title>",
        "desc": "<meta name=\"description\"\n    content=\"Learn about Yacaré, a specialized UX design agency. Our senior product designers partner with B2B SaaS startups to build scalable, high-conversion interfaces.\">"
    },
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/contact.html": {
        "title": "<title>Contact Yacaré: Hire Expert UX/UI Product Designers</title>",
        "desc": "<meta name=\"description\"\n    content=\"Ready to scale your B2B SaaS or launch an MVP? Contact Yacaré's design team today. We build digital products that impact your bottom line.\">"
    },
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/services/discovery-sprint.html": {
        "title": "<title>UX Discovery Sprint: Validate Your B2B Digital Product — Yacaré</title>",
        "desc": "<meta name=\"description\"\n    content=\"Validate your startup idea fast with Yacaré's UX Discovery Sprints. We reduce risks through user research, fast prototyping, and strategic product thinking.\">"
    },
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/services/mvp-jumpstarter.html": {
        "title": "<title>MVP Design & Prototyping Services for SaaS Startups — Yacaré</title>",
        "desc": "<meta name=\"description\"\n    content=\"Launch your B2B SaaS faster with our MVP Jumpstarter. Yacaré delivers high-fidelity prototypes and developer-ready designs tailored for investor pitches and early adoption.\">"
    },
    "/Users/marianonoceti/Desktop/Antigravity/Yacare/services/product-growth.html": {
        "title": "<title>Product Growth & UX Optimization Services — Yacaré</title>",
        "desc": "<meta name=\"description\"\n    content=\"Scale your existing digital products. Yacaré’s Product Growth service focuses on UX audits, conversion rate optimization (CRO), and continuous UI improvements.\">"
    }
}

for fpath, data in files_to_update.items():
    if not os.path.exists(fpath): continue
    with open(fpath, "r") as f:
        content = f.read()

    # Update title
    content = re.sub(r'<title>.*?</title>', data["title"], content, count=1)
    
    # Update description
    content = re.sub(r'<meta name=\"description\"[\s\S]*?>', data["desc"], content, count=1)

    with open(fpath, "w") as f:
        f.write(content)
    print(f"Updated {fpath}")

# Portfolio Titles and Descriptions AND H2s
html_files = glob.glob("/Users/marianonoceti/Desktop/Antigravity/Yacare/work/*.html")

for fpath in html_files:
    with open(fpath, "r") as f:
        content = f.read()

    m = re.search(r'<h1 class="gradient-text">([^<]+)</h1>', content)
    project_name = m.group(1).strip() if m else os.path.basename(fpath).replace(".html","").capitalize()
    
    new_title = f"<title>{project_name} Case Study: Gamified HR Tech App Design — Yacaré</title>"
    if "fintech" in fpath.lower():
       new_title = f"<title>{project_name} Case Study: FinTech Mobile App Design — Yacaré</title>"
    if "edtech" in fpath.lower():
       new_title = f"<title>{project_name} Case Study: EdTech LMS UX Redesign — Yacaré</title>"
    if "pharma" in fpath.lower():
       new_title = f"<title>{project_name} Case Study: B2B Dashboard UX Design — Yacaré</title>"
    if "shopstream" in fpath.lower():
       new_title = f"<title>{project_name} Case Study: E-Commerce AI App UX — Yacaré</title>"
    if "neurocloud" in fpath.lower():
       new_title = f"<title>{project_name} Case Study: Cloud Infrastructure UI/UX — Yacaré</title>"
       

    new_desc = '<meta name="description"\n        content="Boutique UX Factory and Product Design Agency. We design, build, and scale SaaS, digital products, and MVPs that actually impact your bottom line.">'
    
    content = re.sub(r'<title>.*?</title>', new_title, content, count=1)
    content = re.sub(r'<meta name=\"description\"[\s\S]*?>', new_desc, content, count=1)

    # Update H2 The Challenge
    content = re.sub(r'<h2([^>]*)>The Challenge</h2>', r'<h2\1>The SaaS UX Challenge</h2>', content)
    
    # Update H2 The Solution or Our Solution
    content = re.sub(r'<h2([^>]*)>The Solution</h2>', r'<h2\1>Our B2B Product Design Solution</h2>', content)
    content = re.sub(r'<h2([^>]*)>Our Solution</h2>', r'<h2\1>Our B2B Product Design Solution</h2>', content)

    with open(fpath, "w") as f:
        f.write(content)
    print(f"Updated {fpath}")
