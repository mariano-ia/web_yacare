
export function initHorizontalTimeline() {
    const section = document.querySelector('.timeline-container');
    if (!section) return;

    const line = section.querySelector('.timeline-line');
    const dots = Array.from(section.querySelectorAll('.timeline-dot'));
    const cards = Array.from(section.querySelectorAll('.timeline-card'));
    const prevBtn = section.querySelector('.timeline-prev') as HTMLButtonElement;
    const nextBtn = section.querySelector('.timeline-next') as HTMLButtonElement;

    let currentIndex = 0;

    // Intersection Observer for entrance animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 1. Draw the line
                if (line) line.classList.add('visible');

                // 2. Pop dots sequentially
                dots.forEach((dot, index) => {
                    setTimeout(() => {
                        dot.classList.add('visible');
                    }, 500 + (index * 200)); // Delay after line starts
                });

                // 3. Show first card (if none active)
                if (!entry.target.getAttribute('data-active')) {
                    setTimeout(() => {
                        setActiveItem(0);
                        entry.target.setAttribute('data-active', 'true');
                    }, 1500);
                }

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(section);

    // Helper to set active item
    function setActiveItem(index: number) {
        if (index < 0 || index >= dots.length) return;

        currentIndex = index;

        // Remove active class from all
        cards.forEach(c => c.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        // Add active to current
        if (dots[currentIndex]) dots[currentIndex].classList.add('active');
        if (cards[currentIndex]) cards[currentIndex].classList.add('active');

        // Update buttons state
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === dots.length - 1;
    }

    // Click Interaction for Dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            setActiveItem(index);
        });
    });

    // Navigation Buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            setActiveItem(currentIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            setActiveItem(currentIndex + 1);
        });
    }
}
