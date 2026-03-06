import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getSubscribers() {
    try {
        const sb = getServiceClient();
        const { data, error } = await sb
            .from("newsletter_subscribers")
            .select("email, subscribed_at, active")
            .order("subscribed_at", { ascending: false });
        if (error) return [];
        return data ?? [];
    } catch {
        return [];
    }
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default async function SubscribersPage() {
    const subscribers = await getSubscribers() as { email: string; subscribed_at: string; active: boolean }[];
    const active = subscribers.filter((s) => s.active).length;

    return (
        <>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Suscriptores</h1>
                    <p className="dash-page-subtitle">
                        {subscribers.length} suscriptores · {active} activos
                    </p>
                </div>
                <a
                    href="/api/dashboard/subscribers?format=csv"
                    className="dash-btn"
                    download
                >
                    ↓ Descargar CSV
                </a>
            </div>

            <div className="dash-section">
                {subscribers.length === 0 ? (
                    <div className="dash-empty">
                        <p>Todavía no hay suscriptores.</p>
                        <p style={{ marginTop: 6, fontSize: "0.75rem" }}>
                            Asegurate de correr la migración SQL para crear la tabla <code>newsletter_subscribers</code>.
                        </p>
                    </div>
                ) : (
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Fecha suscripción</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.map((s) => (
                                <tr key={s.email}>
                                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{s.email}</td>
                                    <td style={{ fontSize: "0.78rem", color: "var(--dash-muted)" }}>
                                        {formatDate(s.subscribed_at)}
                                    </td>
                                    <td>
                                        <span className={`dash-badge ${s.active ? "dash-badge--published" : "dash-badge--draft"}`}>
                                            {s.active ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
