// ============================================
// YACARÉ — NAVIGATION
// ============================================

export function initNav(): void {
    const nav = document.querySelector('.nav') as HTMLElement | null;
    const toggle = document.querySelector('.nav__toggle') as HTMLElement | null;
    const links = document.querySelector('.nav__links') as HTMLElement | null;
    const navLinks = document.querySelectorAll('.nav__link');

    if (!nav) return;

    // Sticky nav scroll effect
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });

    // Mobile toggle
    if (toggle && links) {
        const closeMenu = () => {
            toggle.classList.remove('active');
            links.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        toggle.addEventListener('click', () => {
            const isOpen = links.classList.toggle('open');
            toggle.classList.toggle('active', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close menu on link click
        navLinks.forEach((link) => {
            link.addEventListener('click', closeMenu);
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && links.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    // Active link highlighting
    highlightActiveLink(navLinks);
}

function highlightActiveLink(links: NodeListOf<Element>): void {
    const currentPath = window.location.pathname;

    links.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Limpiamos clase por defecto
        link.classList.remove('active');

        let isActive = false;

        // Exact match para Home
        if (href === '/' && currentPath === '/') {
            isActive = true;
        }
        // Partial match para el resto (ej. /work.html atrapa /work/algo también)
        else if (href !== '/' && currentPath.includes(href.replace('.html', ''))) {
            isActive = true;
        }

        if (isActive) {
            link.classList.add('active');
        }
    });
}
