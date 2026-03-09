"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

const CATEGORIES = [
    { name: "Tecnología", slug: "tecnologia" },
    { name: "Cultura", slug: "cultura" },
    { name: "Opinión", slug: "opinion" },
    { name: "IA", slug: "ia" },
    { name: "Análisis", slug: "analisis" },
    { name: "Negocios", slug: "negocios" },
    { name: "Fintech", slug: "fintech" },
    { name: "Open Source", slug: "open-source" },
    { name: "Cultura Digital", slug: "cultura-digital" },
];

interface SearchResult {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featured_image?: string;
    reading_time?: number;
    category: { name: string; slug: string; color: string };
    author: { name: string; avatar_initial: string };
}

export function Nav() {
    const { t, lang, setLang } = useI18n();
    const [searchOpen, setSearchOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Focus input when overlay opens
    useEffect(() => {
        if (searchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [searchOpen]);

    // ESC to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSearchOpen(false);
                setQuery("");
                setResults([]);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Debounced search
    const doSearch = useCallback(async (term: string) => {
        if (term.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/blog/api/search?q=${encodeURIComponent(term)}`);
            const data = await res.json();
            setResults(data.results ?? []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (val: string) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 300);
    };

    return (
        <>
            <nav className="ep-nav" role="navigation" aria-label="El Pantano navigation">
                <div className="ep-nav__inner">
                    <Link href="/" className="ep-nav__logo">El Pantano</Link>
                    <div className="ep-nav__cats">
                        {CATEGORIES.map((cat) => (
                            <Link key={cat.slug} href={`/categoria/${cat.slug}`} className={`ep-nav__cat ep-nav__cat--${cat.slug}`}>
                                {t(`categories.${cat.slug}`)}
                            </Link>
                        ))}
                    </div>
                    <div className="ep-nav__actions">
                        <button
                            className="ep-nav__lang"
                            onClick={() => setLang(lang === "es" ? "en" : "es")}
                            aria-label={lang === "es" ? "Switch to English" : "Cambiar a Español"}
                        >
                            {lang === "es" ? "EN" : "ES"}
                        </button>
                        <button className="ep-nav__search" aria-label="Buscar" onClick={() => setSearchOpen(true)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                        <button
                            className="ep-nav__toggle"
                            aria-label="Menú"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="ep-nav__mobile-menu">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/categoria/${cat.slug}`}
                            className={`ep-nav__mobile-link ep-nav__cat--${cat.slug}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {t(`categories.${cat.slug}`)}
                        </Link>
                    ))}
                </div>
            )}

            {/* Search Overlay */}
            <div className={`ep-search-overlay ${searchOpen ? "active" : ""}`} role="dialog" aria-modal="true" aria-label="Buscar en El Pantano">
                <div className="ep-search-overlay__backdrop" onClick={() => { setSearchOpen(false); setQuery(""); setResults([]); }} />
                <div className="ep-search-container">
                    <div className="ep-search-bar">
                        <span className="ep-search-bar__icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            ref={inputRef}
                            type="search"
                            className="ep-search-bar__input"
                            placeholder={t('nav.search')}
                            autoComplete="off"
                            aria-label="Buscar"
                            value={query}
                            onChange={(e) => handleInputChange(e.target.value)}
                        />
                        <button className="ep-search-bar__close" aria-label={t('nav.close')} onClick={() => { setSearchOpen(false); setQuery(""); setResults([]); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Search Results */}
                    {query.length >= 2 && (
                        <div className="ep-search-results">
                            {loading && (
                                <div className="ep-search-results__loading">{t('nav.loading')}</div>
                            )}
                            {!loading && results.length === 0 && (
                                <div className="ep-search-results__empty">
                                    {t('nav.no_results')} &ldquo;{query}&rdquo;
                                </div>
                            )}
                            {!loading && results.map((r) => (
                                <Link key={r.id} href={`/${r.slug}`} className="ep-search-result">
                                    <div className="ep-search-result__cat">
                                        <span className={`ep-cat ep-cat--${r.category.color}`} style={{ fontSize: "0.6rem", padding: "2px 8px" }}>
                                            {r.category.name}
                                        </span>
                                    </div>
                                    <div className="ep-search-result__title">{r.title}</div>
                                    <div className="ep-search-result__meta">
                                        {r.author.name} · {r.reading_time} min
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <span className="ep-search-hint">{t('nav.esc')}</span>
                </div>
            </div>
        </>
    );
}
