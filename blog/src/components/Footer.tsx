export function Footer() {
    return (
        <footer className="ep-footer">
            <div className="ep-footer__inner">
                <div className="ep-footer__top">
                    <div className="ep-footer__brand">
                        <a href="/" className="ep-footer__logo">El Pantano</a>
                        <p className="ep-footer__tagline">
                            Muchas voces. Un solo charco.<br />
                            Tecnología, cultura, IA y opinión sin filtro corporativo.
                        </p>
                    </div>
                    <div>
                        <div className="ep-footer__col-head">Secciones</div>
                        <a href="/categoria/tecnologia" className="ep-footer__link">Tecnología</a>
                        <a href="/categoria/cultura" className="ep-footer__link">Cultura</a>
                        <a href="/categoria/opinion" className="ep-footer__link">Opinión</a>
                        <a href="/categoria/ia" className="ep-footer__link">IA</a>
                        <a href="/categoria/analisis" className="ep-footer__link">Análisis</a>
                    </div>
                    <div>
                        <div className="ep-footer__col-head">El Pantano</div>
                        <a href="#" className="ep-footer__link">Quiénes somos</a>
                        <a href="#" className="ep-footer__link">Colaboradores</a>
                        <a href="#" className="ep-footer__link">Escribir para El Pantano</a>
                        <a href="#" className="ep-footer__link">Newsletter</a>
                    </div>
                    <div>
                        <div className="ep-footer__col-head">Conectar</div>
                        <a href="https://www.linkedin.com/company/yacarearg" target="_blank" rel="noopener" className="ep-footer__link">LinkedIn</a>
                        <a href="https://www.instagram.com/yacare.io/" target="_blank" rel="noopener" className="ep-footer__link">Instagram</a>
                        <a href="/feed.xml" className="ep-footer__link">RSS</a>
                        <a href="https://yacare.io/contact.html" className="ep-footer__link">Contacto</a>
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
                    <div className="ep-footer__social">
                        <a href="https://www.instagram.com/yacare.io/" target="_blank" rel="noopener" aria-label="Instagram">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                        </a>
                        <a href="https://www.linkedin.com/company/yacarearg" target="_blank" rel="noopener" aria-label="LinkedIn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
