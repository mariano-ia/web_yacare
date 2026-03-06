import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Log = {
    id: string;
    workflow: string;
    model: string;
    type: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    article_slug: string | null;
    created_at: string;
};

async function getLogs(): Promise<Log[]> {
    try {
        const sb = getServiceClient();
        const { data, error } = await sb
            .from("ai_usage_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(500);
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

function fmtUsd(n: number) {
    return `$${n.toFixed(4)}`;
}

const MODEL_LABELS: Record<string, string> = {
    "gpt-4o":               "GPT-4o",
    "gemini-imagen":        "Gemini Imagen",
    "gemini-2.5-flash-image": "Gemini Imagen",
};

export default async function LogsPage() {
    const logs = await getLogs();

    const total    = logs.reduce((s, l) => s + Number(l.cost_usd), 0);
    const postCost = logs.filter((l) => l.type === "post").reduce((s, l) => s + Number(l.cost_usd), 0);
    const imgCost  = logs.filter((l) => l.type === "image").reduce((s, l) => s + Number(l.cost_usd), 0);
    const postCount = logs.filter((l) => l.type === "post").length;
    const imgCount  = logs.filter((l) => l.type === "image").length;

    return (
        <>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Historial IA</h1>
                    <p className="dash-page-subtitle">{logs.length} registros · {fmtUsd(total)} acumulado</p>
                </div>
            </div>

            <div className="dash-stats-grid" style={{ marginBottom: 24 }}>
                <div className="dash-stat-card">
                    <div className="dash-stat-card__label">Costo total</div>
                    <div className="dash-stat-card__value dash-stat-card__value--accent">{fmtUsd(total)}</div>
                    <div className="dash-stat-card__sub">{logs.length} ejecuciones</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-card__label">Posts (GPT-4o)</div>
                    <div className="dash-stat-card__value">{fmtUsd(postCost)}</div>
                    <div className="dash-stat-card__sub">{postCount} artículos generados</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-card__label">Imágenes (Gemini)</div>
                    <div className="dash-stat-card__value dash-stat-card__value--amber">{fmtUsd(imgCost)}</div>
                    <div className="dash-stat-card__sub">{imgCount} imágenes generadas</div>
                </div>
            </div>

            <div className="dash-section">
                {logs.length === 0 ? (
                    <div className="dash-empty">
                        <p>No hay registros todavía.</p>
                        <p style={{ marginTop: 6, fontSize: "0.75rem" }}>
                            Los registros se crean automáticamente cuando N8N ejecuta el workflow.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Workflow</th>
                                    <th>Modelo</th>
                                    <th>Tipo</th>
                                    <th style={{ textAlign: "right" }}>T. entrada</th>
                                    <th style={{ textAlign: "right" }}>T. salida</th>
                                    <th style={{ textAlign: "right" }}>Costo</th>
                                    <th>Artículo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ fontSize: "0.75rem", color: "var(--dash-muted)", whiteSpace: "nowrap" }}>
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td>
                                            <span className={`dash-badge ${log.workflow === "telegram" ? "dash-badge--draft" : "dash-badge--published"}`}>
                                                {log.workflow}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                                            {MODEL_LABELS[log.model] ?? log.model}
                                        </td>
                                        <td>
                                            <span className={`dash-badge ${log.type === "post" ? "dash-badge--hero" : "dash-badge--draft"}`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: "0.75rem", color: "var(--dash-muted)", textAlign: "right" }}>
                                            {log.tokens_in ? log.tokens_in.toLocaleString("es-AR") : "—"}
                                        </td>
                                        <td style={{ fontSize: "0.75rem", color: "var(--dash-muted)", textAlign: "right" }}>
                                            {log.tokens_out ? log.tokens_out.toLocaleString("es-AR") : "—"}
                                        </td>
                                        <td style={{ fontWeight: 600, fontSize: "0.78rem", textAlign: "right", whiteSpace: "nowrap" }}>
                                            {fmtUsd(Number(log.cost_usd))}
                                        </td>
                                        <td style={{ fontSize: "0.72rem", color: "var(--dash-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {log.article_slug ? (
                                                <a
                                                    href={`/${log.article_slug}`}
                                                    target="_blank"
                                                    rel="noopener"
                                                    style={{ color: "var(--dash-accent)", textDecoration: "none" }}
                                                >
                                                    {log.article_slug}
                                                </a>
                                            ) : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
