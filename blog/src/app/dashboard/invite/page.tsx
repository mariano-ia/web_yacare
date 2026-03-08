"use client";

import { useState } from "react";

export default function InvitePage() {
    const [email, setEmail]   = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent]     = useState(false);
    const [sentTo, setSentTo] = useState("");
    const [error, setError]   = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await fetch("/api/dashboard/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            setError(data.error || "Error al enviar la invitación.");
            setLoading(false);
            return;
        }

        setSentTo(email);
        setSent(true);
        setEmail("");
        setLoading(false);
    }

    return (
        <>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Invitar usuario</h1>
                    <p className="dash-page-subtitle">
                        El invitado recibirá un email para crear su contraseña. Solo usuarios invitados pueden acceder al dashboard.
                    </p>
                </div>
            </div>

            <div className="dash-section">
                <div style={{ padding: "24px", maxWidth: 480 }}>
                    {sent && (
                        <div className="dash-success-msg" style={{ marginBottom: 16 }}>
                            Invitación enviada a <strong>{sentTo}</strong>. El link es válido por 24 hs.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="dash-form">
                        {error && <div className="dash-error-msg">{error}</div>}

                        <div className="dash-form-group">
                            <label htmlFor="email">Email del invitado *</label>
                            <input
                                id="email"
                                type="email"
                                className="dash-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@ejemplo.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="dash-form-footer">
                            <button
                                type="submit"
                                className="dash-btn dash-btn--primary"
                                disabled={loading}
                            >
                                {loading ? "Enviando…" : "Enviar invitación"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
