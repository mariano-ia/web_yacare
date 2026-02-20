import os

REPLACEMENTS = {
    # 1. Nav (Botón Principal)
    "Get Started": "Let's Talk",

    # 2. Services (Hero Subtítulo) - remove "Choose the stage of the journey that fits your current challenge."
    "We don't sell hours. We sell clarity, speed, and obsessive quality.\n                    Choose the stage of the journey that fits your current challenge.": "We don't sell hours. We sell clarity, speed, and obsessive quality.",
    "We don't sell hours. We sell clarity, speed, and obsessive quality. Choose the stage of the journey that fits your current challenge.": "We don't sell hours. We sell clarity, speed, and obsessive quality.",

    # 3. Services (Intro H2)
    "OUR ENGAGEMENT MODELS": "Engagement Models",

    # 4. Services (Intro P)
    "Flexible models designed to adapt to your project's maturity and speed requirements.": "Built to match your speed and product maturity.",

    # 5. Services (CTAs) 
    # Because 'View More' might be used everywhere, let's just replace the exact text in links.
    "><span>View More</span>": "><span>Explore</span>",
    "><span>View\n                                        More</span>": "><span>Explore</span>",
    "View More</a>": "Explore</a>",
    ">View More<": ">Explore<",

    # 6. Work / Portafolio -> It seems "CASE STUDIES" was already removed, but we'll fix the meta description
    "Case studies and projects from Yacaré.": "Selected work and projects from Yacaré.",

    # 7. Contact (Botón Form)
    "Send Message": "Send Proposal"
}

def apply_copy_changes():
    # Process both normal site files and scripts like fix_nav.py
    for root, _, files in os.walk('.'):
        if 'node_modules' in root or 'dist' in root or '.git' in root or '.agent' in root:
            continue
        for file in files:
            if file.endswith('.html') or file == 'fix_nav.py':
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                original_content = content
                for old_str, new_str in REPLACEMENTS.items():
                    if old_str in content:
                        content = content.replace(old_str, new_str)
                
                # Cleanup specific multiline for View More if the exact matching failed
                content = content.replace("<span>View\\n                                        More</span>", "<span>Explore</span>")

                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Applied UX copy updates to {filepath}")

if __name__ == "__main__":
    apply_copy_changes()
    print("Done applying anti-gravity rules!")
