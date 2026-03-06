import Link from "next/link";

export function Footer() {
    return (
        <footer className="ep-footer">
            <div className="ep-footer__inner">
                <div className="ep-footer__top">
                    <div className="ep-footer__brand">
                        <Link href="/" className="ep-footer__logo">El Pantano</Link>
                        <p className="ep-footer__tagline">
                            Muchas voces. Un solo charco.<br />
                            Tecnología, cultura, IA y opinión sin filtro corporativo.
                        </p>
                    </div>
                    <div>
                        <div className="ep-footer__col-head">Secciones</div>
                        <Link href="/categoria/tecnologia" className="ep-footer__link">Tecnología</Link>
                        <Link href="/categoria/cultura" className="ep-footer__link">Cultura</Link>
                        <Link href="/categoria/opinion" className="ep-footer__link">Opinión</Link>
                        <Link href="/categoria/ia" className="ep-footer__link">IA</Link>
                        <Link href="/categoria/analisis" className="ep-footer__link">Análisis</Link>
                    </div>
                    <div>
                        <div className="ep-footer__col-head">Conectar</div>
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
                </div>
            </div>
        </footer>
    );
}
