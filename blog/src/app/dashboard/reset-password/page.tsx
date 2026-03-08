"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAuthBrowserClient } from "@/lib/supabase-auth";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm]   = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const [done, setDone]         = useState(false);
    const [ready, setReady]       = useState(false);

    useEffect(() => {
        // Supabase embeds the recovery tokens in the URL hash.
        // onAuthStateChange fires PASSWORD_RECOVERY once the SDK
        // has exchanged the hash for a valid session.
        const supabase = createAuthBrowserClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setReady(true);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        setError("");
        setLoading(true);

        const supabase = createAuthBrowserClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setDone(true);
        setTimeout(() => router.push("/dashboard"), 2000);
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
                    <h1 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 20, color: "var(--dash-text)" }}>
                        Nueva contraseña
                    </h1>

                    {done ? (
                        <div className="dash-success-msg">
                            ¡Contraseña actualizada! Redirigiendo al dashboard…
                        </div>
                    ) : !ready ? (
                        <p style={{ fontSize: "0.82rem", color: "var(--dash-muted)" }}>
                            Verificando link…
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="dash-form" style={{ gap: 14 }}>
                            {error && <div className="dash-error-msg">{error}</div>}

                            <div className="dash-form-group">
                                <label htmlFor="password">Nueva contraseña</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="dash-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoFocus
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="dash-form-group">
                                <label htmlFor="confirm">Confirmar contraseña</label>
                                <input
                                    id="confirm"
                                    type="password"
                                    className="dash-input"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                />
                            </div>

                            <button
                                type="submit"
                                className="dash-btn dash-btn--primary"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={loading}
                            >
                                {loading ? "Guardando…" : "Guardar contraseña"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
