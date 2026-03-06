import Link from "next/link";

export function Footer() {
    return (
        <footer className="ep-footer">
            <div className="ep-footer__inner">
                <div className="ep-footer__top">
                    <div className="ep-footer__brand">
                        <Link href="/" className="ep-footer__logo">El Pantano</Link>
                        <p className="ep-footer__tagline">
                            Muchas voces. Un solo charco. Tecnología, cultura, IA y opinión sin filtro corporativo.
                        </p>
                    </div>
                    <div className="ep-footer__social">
                        <a href="https://x.com/yacareio" target="_blank" rel="noopener" aria-label="Siguenos en X (Twitter)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a href="https://linkedin.com/company/yacare" target="_blank" rel="noopener" aria-label="Siguenos en LinkedIn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                        <a href="https://yacare.io/contact.html" aria-label="Contacto">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                        </a>
                    </div>
                </div>
                <div className="ep-footer__bottom">
                    <div className="ep-footer__legal">
                        <span>© 2026 El Pantano</span>
                        <a href="https://yacare.io/privacy-policy.html" className="ep-footer__link" style={{ opacity: 0.6, margin: 0 }}>Privacidad</a>
                        <a href="https://yacare.io/terms-and-conditions.html" className="ep-footer__link" style={{ opacity: 0.6, margin: 0 }}>Términos</a>
                    </div>
                    <div className="ep-footer__yacare">
                        <span className="ep-footer__yacare-text">Un editorial de</span>
                        <a href="https://yacare.io" className="ep-footer__yacare-link" title="Yacaré — Boutique Digital Product Agency">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://yacare.io/logo_yacare.svg" alt="Yacaré" className="ep-footer__yacare-img" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
