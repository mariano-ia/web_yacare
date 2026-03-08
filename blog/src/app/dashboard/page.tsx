"use client";

import { useState, useEffect, useCallback } from "react";

type Period = "week" | "month" | "all";

interface Stats {
    articles: { total: number; this_month: number };
    subscribers: number;
    costs: {
        all_time: { total: number; posts: number; images: number };
        this_month: { total: number; posts: number; images: number };
        this_week: { total: number; posts: number; images: number };
    };
}

function fmt(n: number) {
    return n.toLocaleString("es-AR");
}

function fmtUsd(n: number) {
    return `$${n.toFixed(4)}`;
}

export default function DashboardPage() {
    const [period, setPeriod] = useState<Period>("month");
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/blog/api/dashboard/stats");
            const data = await res.json();
            setStats(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const costs = stats
        ? (period === "week" ? stats.costs.this_week : period === "month" ? stats.costs.this_month : stats.costs.all_time)
        : null;

    return (
        <>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Resumen</h1>
                    <p className="dash-page-subtitle">Vista general del blog y costos de IA</p>
                </div>
            </div>

            {/* Period selector */}
            <div className="dash-period-tabs">
                {([["week", "Esta semana"], ["month", "Este mes"], ["all", "Total"]] as [Period, string][]).map(([v, label]) => (
                    <button
                        key={v}
                        className={`dash-period-tab ${period === v ? "dash-period-tab--active" : ""}`}
                        onClick={() => setPeriod(v)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Stats cards */}
            <div className="dash-stats-grid">
                <div className="dash-stat-card">
                    <div className="dash-stat-card__label">Posts publicados</div>
                    <div className="dash-stat-card__value">
                        {loading ? "—" : fmt(stats?.articles.total ?? 0)}
                    </div>
                    <div className="dash-stat-card__sub">
                        {loading ? "" : `+${fmt(stats?.articles.this_month ?? 0)} este mes`}
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-card__label">Suscriptores</div>
                    <div className="dash-stat-card__value dash-stat-card__value--green">
                        {loading ? "—" : fmt(stats?.subscribers ?? 0)}
                    </div>
                    <div className="dash-stat-card__sub">Newsletter activo</div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-card__label">Costo total IA</div>
                    <div className="dash-stat-card__value dash-stat-card__value--accent">
                        {loading ? "—" : fmtUsd(costs?.total ?? 0)}
                    </div>
                    <div className="dash-stat-card__sub">
                        Posts {fmtUsd(costs?.posts ?? 0)} · Imágenes {fmtUsd(costs?.images ?? 0)}
                    </div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-card__label">Costo imágenes</div>
                    <div className="dash-stat-card__value dash-stat-card__value--amber">
                        {loading ? "—" : fmtUsd(costs?.images ?? 0)}
                    </div>
                    <div className="dash-stat-card__sub">Gemini Imagen</div>
                </div>

                <div className="dash-stat-card">
                    <div className="dash-stat-card__label">Costo creación posts</div>
                    <div className="dash-stat-card__value">
                        {loading ? "—" : fmtUsd(costs?.posts ?? 0)}
                    </div>
                    <div className="dash-stat-card__sub">OpenAI GPT-4o</div>
                </div>
            </div>

            {/* Info block about token logging */}
            {!loading && (costs?.total ?? 0) === 0 && (
                <div className="dash-section" style={{ marginTop: 0 }}>
                    <div className="dash-section__header">
                        <span className="dash-section__title">Cómo activar el tracking de tokens</span>
                    </div>
                    <div style={{ padding: "16px 20px", fontSize: "0.82rem", color: "var(--dash-muted)", lineHeight: 1.6 }}>
                        <p style={{ marginBottom: 8 }}>
                            Los costos se registran automáticamente cuando N8N llama al endpoint <code style={{ background: "var(--dash-surface-2)", padding: "1px 5px", borderRadius: 4, fontSize: "0.78rem" }}>POST /api/ai-usage</code>.
                        </p>
                        <p>
                            Ejecutá el workflow de N8N y corrés la migración SQL en <strong>Supabase → SQL Editor</strong> usando el archivo <code style={{ background: "var(--dash-surface-2)", padding: "1px 5px", borderRadius: 4, fontSize: "0.78rem" }}>migrations/001_dashboard.sql</code>.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
