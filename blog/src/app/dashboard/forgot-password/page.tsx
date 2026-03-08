"use client";

import { useState } from "react";
import { createAuthBrowserClient } from "@/lib/supabase-auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.yacare.io/blog";

export default function ForgotPasswordPage() {
    const [email, setEmail]   = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent]     = useState(false);
    const [error, setError]   = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const supabase = createAuthBrowserClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${SITE_URL}/dashboard/reset-password`,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setSent(true);
        setLoading(false);
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
        }}>
            <div style={{ width: "100%", maxWidth: 380 }}>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--dash-text)", letterSpacing: "-0.02em" }}>
                        El Pantano
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--dash-muted)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Dashboard
                    </div>
                </div>

                <div style={{
                    background: "var(--dash-surface)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "var(--dash-radius)",
                    padding: "28px 24px",
                }}>
                    <h1 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 6, color: "var(--dash-text)" }}>
                        Recuperar contraseña
                    </h1>
                    <p style={{ fontSize: "0.78rem", color: "var(--dash-muted)", marginBottom: 20 }}>
                        Te enviamos un link para restablecer tu contraseña.
                    </p>

                    {sent ? (
                        <div className="dash-success-msg">
                            Listo. Revisá tu email y seguí el link para crear tu nueva contraseña.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="dash-form" style={{ gap: 14 }}>
                            {error && <div className="dash-error-msg">{error}</div>}

                            <div className="dash-form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="dash-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="dash-btn dash-btn--primary"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={loading}
                            >
                                {loading ? "Enviando…" : "Enviar link"}
                            </button>
                        </form>
                    )}

                    <div style={{ textAlign: "center", marginTop: 20 }}>
                        <a
                            href="/dashboard/login"
                            style={{ fontSize: "0.75rem", color: "var(--dash-muted)", textDecoration: "none" }}
                        >
                            ← Volver al login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
