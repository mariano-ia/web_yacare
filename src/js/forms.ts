export function initForms(): void {
    // Select forms that have an action pointing to formspree
    const contactForms = document.querySelectorAll<HTMLFormElement>('form[action*="formspree.io"]');

    contactForms.forEach((form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton?.innerHTML || '';
            const action = form.getAttribute('action') || '';

            // Loading state
            if (submitButton) {
                submitButton.setAttribute('disabled', 'true');
                submitButton.innerHTML = '<span>Sending...</span>';
            }

            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showSuccess(form);
                } else {
                    const data = await response.json();
                    if (data.errors) {
                        alert(data.errors.map((error: any) => error.message).join(", "));
                    } else {
                        throw new Error('Form submission failed');
                    }
                }
            } catch (error) {
                console.error(error);
                alert('Hubo un error al enviar el mensaje. Por favor intenta de nuevo.');
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
    successMsg.className = 'form-success-message reveal';
    successMsg.style.textAlign = 'center';
    successMsg.style.padding = 'var(--space-8) 0';
    successMsg.innerHTML = `
        <div class="success-icon" style="margin-bottom: var(--space-4); color: var(--accent-primary);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        </div>
        <h3 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: var(--space-2);">¡Gracias!</h3>
        <p class="text-lg" style="color: var(--text-secondary); max-width: 400px; margin: 0 auto;">
            Recibimos tu mensaje. Ya te vamos a responder. Gracias.
        </p>
    `;

    // Animation out
    form.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    form.style.opacity = '0';
    form.style.transform = 'translateY(10px)';

    setTimeout(() => {
        form.style.display = 'none';
        parent.appendChild(successMsg);

        // Staggered reveal of success message
        requestAnimationFrame(() => {
            successMsg.style.opacity = '1';
            successMsg.style.transform = 'translateY(0)';
        });
    }, 400);
}
