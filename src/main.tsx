import React from 'react';
import { createRoot } from 'react-dom/client';
import { FlipButton } from './components/ui/flip-button';
import './index.css';

function replaceButtons() {
    const primaryButtons = document.querySelectorAll('.btn--primary:not([data-react-replaced])');
    const secondaryButtons = document.querySelectorAll('.btn--secondary:not([data-react-replaced])');

    primaryButtons.forEach((btn) => {
        const element = btn as HTMLAnchorElement | HTMLButtonElement;
        const frontText = element.innerText || 'Action';
        const href = (element as HTMLAnchorElement).href;
        const className = element.className;

        // Create a container
        const container = document.createElement('span');
        element.parentNode?.replaceChild(container, element);

        createRoot(container).render(
            <FlipButton
                frontText={frontText}
                backText="Let's Go"
                className={className}
                frontClassName="bg-white text-black border-none"
                backClassName="bg-[#8A5EFF] text-white border-none"
                onClick={() => {
                    if (href) window.location.href = href;
                }}
            />
        );
    });

    secondaryButtons.forEach((btn) => {
        const element = btn as HTMLAnchorElement | HTMLButtonElement;
        const frontText = element.innerText || 'Action';
        const href = (element as HTMLAnchorElement).href;
        const className = element.className;

        const container = document.createElement('span');
        element.parentNode?.replaceChild(container, element);

        createRoot(container).render(
            <FlipButton
                frontText={frontText}
                backText="Explore"
                className={className}
                frontClassName="bg-transparent text-white border-white/20"
                backClassName="bg-white text-black border-none"
                onClick={() => {
                    if (href) window.location.href = href;
                }}
            />
        );
    });
}

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replaceButtons);
} else {
    replaceButtons();
}
