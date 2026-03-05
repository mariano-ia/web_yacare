"use client";

import Link from "next/link";
import { useState } from "react";
import type { ArticleWithRelations } from "@/lib/types";

export function Sidebar({ trending }: { trending: ArticleWithRelations[] }) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus("error");
            setMessage("Ingresá un email válido.");
            return;
        }

        setStatus("loading");
        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setStatus("success");
                setMessage(data.message || "¡Suscripción confirmada!");
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.error || "Hubo un error. Intentá de nuevo.");
            }
        } catch {
            setStatus("error");
            setMessage("Error de conexión. Intentá de nuevo.");
        }
    };

    return (
        <aside className="ep-sidebar">
            {/* Newsletter */}
            <div className="ep-sidebar__box">
                <div className="ep-newsletter__eyebrow">Newsletter</div>
                <h3 className="ep-newsletter__title">
                    El Pantano directo<br />a tu casilla.
                </h3>
                <p className="ep-newsletter__desc">
                    Una vez por semana. Lo más leído, lo más debatido, sin algoritmo de por medio.
                </p>
                {status === "success" ? (
                    <div className="ep-newsletter__success">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#4ade80" }}>
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{message}</span>
                    </div>
                ) : (
                    <form className="ep-newsletter__form" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            className="ep-newsletter__input"
                            placeholder="tu@email.com"
                            aria-label="Email para newsletter"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                            disabled={status === "loading"}
                        />
                        <button
                            type="submit"
                            className="ep-newsletter__btn"
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Enviando…" : "Suscribirme"}
                        </button>
                        {status === "error" && (
                            <p className="ep-newsletter__error">{message}</p>
                        )}
                    </form>
                )}
            </div>

            {/* Trending */}
            <div className="ep-sidebar__box">
                <div className="ep-section-head" style={{ marginBottom: "var(--space-4)", paddingBottom: "var(--space-3)" }}>
                    <span className="ep-section-head__bar ep-section-head__bar--amber" />
                    <span className="ep-section-head__label" style={{ fontSize: "0.85rem" }}>Más leídos</span>
                </div>
                <nav className="ep-trending" aria-label="Artículos más leídos">
                    {trending.slice(0, 5).map((article, i) => (
                        <Link key={article.id} href={`/${article.slug}`} className="ep-trending__item">
                            <span className="ep-trending__num">{i + 1}</span>
                            <div className="ep-trending__body">
                                <div className="ep-trending__cat">
                                    <span className={`ep-cat ep-cat--${article.category.color}`} style={{ fontSize: "0.6rem", padding: "2px 8px" }}>
                                        {article.category.name}
                                    </span>
                                </div>
                                <div className="ep-trending__title">{article.title}</div>
                            </div>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Ad placeholder — will be replaced by AdSense */}
            <div className="ep-ad ep-ad--mrect" role="complementary" id="sidebar-ad">
                <span className="ep-ad__label">Publicidad</span>
                <div className="ep-ad__slot">300 × 250</div>
            </div>
        </aside>
    );
}
