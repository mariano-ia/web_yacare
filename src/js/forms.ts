export function initForms(): void {
    // Select forms that have an action pointing to formspree
    const contactForms = document.querySelectorAll<HTMLFormElement>('form[action*="formspree.io"]');

    contactForms.forEach((form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton?.innerHTML || '';
            const action = form.getAttribute('action') || '';

            if (submitButton) {
                submitButton.setAttribute('disabled', 'true');
                submitButton.innerHTML = '<span>Sending...</span>';
            }

            // Convert FormData to JSON
            const formData = new FormData(form);
            const data: Record<string, any> = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showSuccess(form);
                } else {
                    const result = await response.json();
                    if (result.errors) {
                        alert(result.errors.map((error: any) => error.message).join(", "));
                    } else {
                        throw new Error('Submission failed');
                    }
                }
            } catch (error) {
                console.error('Form submission error:', error);
                alert('Something went wrong. Please try again or email us directly at contact@yacare.io');
            } finally {
                if (submitButton) {
                    submitButton.removeAttribute('disabled');
                    submitButton.innerHTML = originalButtonText;
                }
            }
        });
    });
}

function showSuccess(form: HTMLFormElement): void {
    const parent = form.parentElement;
    if (!parent) return;

    // Create success message element
    const successMsg = document.createElement('div');
    successMsg.className = 'form-success-message';
    successMsg.style.cssText = `
        text-align: center;
        padding: var(--space-12) var(--space-6);
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-lg);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    successMsg.innerHTML = `
        <div class="success-icon" style="margin-bottom: var(--space-6); color: var(--accent-primary); display: flex; justify-content: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="check" style="width: 40px; height: 40px;"></i>
            </div>
        </div>
        <h3 style="font-family: var(--font-display); font-size: 2.5rem; margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: 0.05em;">Message Sent</h3>
        <p class="text-lg" style="color: var(--text-secondary); max-width: 450px; margin: 0 auto; line-height: 1.6;">
            We've received your inquiry. A member of our team will get back to you within 24 hours.
        </p>
    `;

    // Animation out the form
    form.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    form.style.opacity = '0';
    form.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        form.style.display = 'none';
        parent.appendChild(successMsg);

        // Init icons
        if ((window as any).lucide) {
            (window as any).lucide.createIcons();
        }

        // Animation in success message
        requestAnimationFrame(() => {
            setTimeout(() => {
                successMsg.style.opacity = '1';
                successMsg.style.transform = 'translateY(0)';
            }, 50);
        });
    }, 400);
}
