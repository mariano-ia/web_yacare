// ============================================
// YACARÉ — MAIN ENTRY POINT
// ============================================

import { initNav } from './nav';
import { initAnimations } from './animations';

// CSS imports
import '../styles/tokens.css';
import '../styles/reset.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/animations.css';
import '../styles/scroll-gradient.css';
import '../styles/pages.css';

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initAnimations();
    initAccordion();
    initHorizontalScroll();
    initTypewriter();
    initScrollGradient();
    initWordReveal();

    // Initialize Lucide Icons (fallback to global if import fails)
    if ((window as any).lucide) {
        (window as any).lucide.createIcons();
    }
});







// ── FAQ Accordion ──
function initAccordion(): void {
    const triggers = document.querySelectorAll('.accordion__trigger');

    triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
            const item = trigger.parentElement;
            if (!item) return;

            const isActive = item.classList.contains('active');

            // Close all items
            document.querySelectorAll('.accordion__item').forEach((i) => {
                i.classList.remove('active');
            });

            // Toggle current
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// ── Horizontal Scroll (drag) ──
function initHorizontalScroll(): void {
    const scrollContainers = document.querySelectorAll('.horizontal-scroll');

    scrollContainers.forEach((container) => {
        let isDown = false;
        let startX: number;
        let scrollLeft: number;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = (e as MouseEvent).pageX - (container as HTMLElement).offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => { isDown = false; });
        container.addEventListener('mouseup', () => { isDown = false; });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = (e as MouseEvent).pageX - (container as HTMLElement).offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
    });
}

// ── Typewriter Effect ──
function initTypewriter(): void {
    const labels = document.querySelectorAll('.label');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target as HTMLElement;
                if (el.dataset.typed === "true") return; // Already typed

                const text = el.textContent?.trim() || '';
                if (!text) return;

                el.dataset.typed = "true";
                el.textContent = ''; // Clear text

                let i = 0;
                // Delay slightly before starting
                setTimeout(() => {
                    const interval = setInterval(() => {
                        el.textContent += text.charAt(i);
                        i++;
                        if (i >= text.length) {
                            clearInterval(interval);
                            // No cursor - just finish typing
                        }
                    }, 50); // Typing speed
                }, 300);

                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% visible

    labels.forEach(label => observer.observe(label));
}

// ── Scroll Reveal Effect (Typebot-style) ──
function initScrollGradient() {
    const section = document.querySelector('.gradient-scroll-section') as HTMLElement;
    const frame = document.querySelector('.reveal-frame') as HTMLElement;
    const bg = document.querySelector('.reveal-background') as HTMLElement;
    const content = document.querySelector('.gradient-scroll-content') as HTMLElement;

    if (!section || !frame) return;

    const handleScroll = () => {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const sectionHeight = section.offsetHeight;

        // Total scrollable distance within this section
        // When rect.top = 0, user just entered the sticky zone
        // When rect.top = -(sectionHeight - viewportHeight), user is at the end
        const scrollableDistance = sectionHeight - viewportHeight;
        const scrolledIntoSection = -rect.top; // positive when scrolled past top

        // Global progress: 0 when section enters viewport, 1 when section fully scrolled
        const rawProgress = scrolledIntoSection / scrollableDistance;
        const progress = Math.max(0, Math.min(1, rawProgress));

        // Phase 1 (0 → 0.5): Expand the frame
        const expandProgress = Math.min(1, progress / 0.5);
        const yInset = 35 * (1 - expandProgress);
        const xInset = 20 * (1 - expandProgress);
        const radius = 48 * (1 - expandProgress);
        frame.style.clipPath = `inset(${yInset.toFixed(2)}% ${xInset.toFixed(2)}% round ${radius.toFixed(1)}px)`;

        // Phase 2 (0.5 → 0.85): Fade background violet → black
        if (bg) {
            const fadeProgress = Math.max(0, Math.min(1, (progress - 0.5) / 0.35));
            bg.style.opacity = (1 - fadeProgress).toString();
        }

        // Phase 3 (0.3 → 0.7): Fade in content
        if (content) {
            const contentProgress = Math.max(0, Math.min(1, (progress - 0.3) / 0.4));
            content.style.opacity = contentProgress.toString();
        }
    };

    // Throttle with RAF
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Initial call
    handleScroll();
}

// ── Word-by-word Reveal (About Statement) ──
function initWordReveal(): void {
    const paragraphs = document.querySelectorAll('.reveal-words');

    paragraphs.forEach((p) => {
        const text = p.textContent?.trim() || '';
        if (!text) return;

        // Wrap each word in a span
        const words = text.split(/\s+/);
        p.innerHTML = words
            .map((w, i) => `<span class="word" style="transition-delay:${i * 40}ms">${w}</span>`)
            .join(' ');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    p.querySelectorAll('.word').forEach(w => w.classList.add('visible'));
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observer.observe(p);
    });
}
