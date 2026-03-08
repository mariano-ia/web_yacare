"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const next = params.get("next") || "/dashboard";

    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await fetch("/blog/api/dashboard/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", email, password }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            setError(data.error || "Email o contraseña incorrectos.");
            setLoading(false);
            return;
        }

        router.push(next);
        router.refresh();
    }

    return (
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
                    autoComplete="email"
                />
            </div>

            <div className="dash-form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                    id="password"
                    type="password"
                    className="dash-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                />
            </div>

            <button
                type="submit"
                className="dash-btn dash-btn--primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={loading}
            >
                {loading ? "Ingresando…" : "Ingresar"}
            </button>

            <div style={{ textAlign: "center" }}>
                <Link
                    href="/dashboard/forgot-password"
                    style={{ fontSize: "0.75rem", color: "var(--dash-muted)", textDecoration: "none" }}
                >
                    Olvidé mi contraseña
                </Link>
            </div>
        </form>
    );
}

export default function LoginPage() {
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
                    <h1 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 20, color: "var(--dash-text)" }}>
                        Iniciar sesión
                    </h1>
                    <Suspense>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
