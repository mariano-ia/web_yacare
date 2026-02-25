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

    // Dynamic Review Score
    updateReviewScore();
}

/**
 * Fetches reviews from the API and updates the score in the nav bar.
 */
async function updateReviewScore(): Promise<void> {
    const scoreElement = document.getElementById('nav-score-value');
    if (!scoreElement) return;

    try {
        const response = await fetch('https://reviews-yacare.vercel.app/api/reviews');
        if (!response.ok) throw new Error('API request failed');

        const reviews = await response.json();

        if (Array.isArray(reviews) && reviews.length > 0) {
            const totalScore = reviews.reduce((acc, curr) => acc + Number(curr.rating), 0);
            const avgScore = (totalScore / reviews.length).toFixed(1);
            scoreElement.textContent = avgScore;
        } else {
            scoreElement.textContent = '5.0'; // Fallback if no reviews
        }
    } catch (error) {
        console.error('Error fetching review score:', error);
        scoreElement.textContent = '5.0'; // Fallback value
    }
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
