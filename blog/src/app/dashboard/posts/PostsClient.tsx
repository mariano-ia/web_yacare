"use client";

import Link from "next/link";
import { useState } from "react";

interface Post {
    id: string;
    title: string;
    slug: string;
    status: string;
    published_at: string;
    is_hero: boolean;
    is_featured: boolean;
    view_count: number;
    category: { name: string; slug: string; color: string };
    author: { name: string };
}

const CAT_COLORS: Record<string, string> = {
    tecnologia: "#a78bfa",
    ia: "#22d3ee",
    analisis: "#fbbf24",
    cultura: "#f87171",
    negocios: "#fb923c",
    opinion: "#4ade80",
    fintech: "#2dd4bf",
    "open-source": "#a3e635",
    "cultura-digital": "#f472b6",
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export function PostsClient({ initialPosts }: { initialPosts: Post[] }) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [loading, setLoading] = useState<string | null>(null);

    const maxViews = Math.max(...posts.map((p) => p.view_count ?? 0), 1);

    async function toggleHero(post: Post) {
        setLoading(post.id);
        try {
            const res = await fetch(`/api/dashboard/posts/${post.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_hero: !post.is_hero }),
            });
            if (!res.ok) throw new Error("Error");
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id
                        ? { ...p, is_hero: !post.is_hero }
                        : post.is_hero
                        ? p  // was hero, keep others as-is (server cleared them)
                        : { ...p, is_hero: false } // setting new hero, clear others
                )
            );
        } finally {
            setLoading(null);
        }
    }

    async function deletePost(post: Post) {
        if (!confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return;
        setLoading(post.id);
        try {
            const res = await fetch(`/api/dashboard/posts/${post.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error");
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
        } finally {
            setLoading(null);
        }
    }

    if (posts.length === 0) {
        return (
            <div className="dash-empty">
                <p>No hay posts todavía.</p>
                <Link href="/dashboard/posts/new" className="dash-btn dash-btn--primary" style={{ marginTop: 12, display: "inline-flex" }}>
                    Crear primer post
                </Link>
            </div>
        );
    }

    return (
        <div style={{ overflowX: "auto" }}>
            <table className="dash-table">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Categoría</th>
                        <th>Autor</th>
                        <th>Publicado</th>
                        <th>Visitas</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map((post) => (
                        <tr key={post.id} style={{ opacity: loading === post.id ? 0.5 : 1 }}>
                            {/* Title + hero badge */}
                            <td style={{ maxWidth: 320 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    <a
                                        href={`/${post.slug}`}
                                        target="_blank"
                                        rel="noopener"
                                        style={{ color: "var(--dash-text)", textDecoration: "none", fontWeight: 500, fontSize: "0.82rem", lineHeight: 1.35 }}
                                    >
                                        {post.title}
                                    </a>
                                    {post.is_hero && (
                                        <span className="dash-badge dash-badge--hero" style={{ width: "fit-content" }}>
                                            ★ Portada
                                        </span>
                                    )}
                                </div>
                            </td>

                            {/* Category */}
                            <td>
                                <span style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                                    <span
                                        className="dash-cat-dot"
                                        style={{ background: CAT_COLORS[post.category.slug] ?? "#888" }}
                                    />
                                    <span style={{ fontSize: "0.78rem" }}>{post.category.name}</span>
                                </span>
                            </td>

                            {/* Author */}
                            <td style={{ fontSize: "0.78rem", color: "var(--dash-muted)", whiteSpace: "nowrap" }}>
                                {post.author.name}
                            </td>

                            {/* Date */}
                            <td style={{ fontSize: "0.78rem", color: "var(--dash-muted)", whiteSpace: "nowrap" }}>
                                {formatDate(post.published_at)}
                            </td>

                            {/* Views bar */}
                            <td>
                                <div className="dash-views-bar">
                                    <div className="dash-views-bar__track">
                                        <div
                                            className="dash-views-bar__fill"
                                            style={{ width: `${((post.view_count ?? 0) / maxViews) * 100}%` }}
                                        />
                                    </div>
                                    <span className="dash-views-bar__num">{post.view_count ?? 0}</span>
                                </div>
                            </td>

                            {/* Status */}
                            <td>
                                <span className={`dash-badge dash-badge--${post.status}`}>
                                    {post.status === "published" ? "Publicado" : "Borrador"}
                                </span>
                            </td>

                            {/* Actions */}
                            <td>
                                <div className="dash-btn-row">
                                    <Link
                                        href={`/dashboard/posts/${post.id}`}
                                        className="dash-btn dash-btn--ghost"
                                        title="Editar"
                                    >
                                        ✎
                                    </Link>
                                    <button
                                        className={`dash-btn ${post.is_hero ? "dash-btn--hero-active" : "dash-btn--ghost"}`}
                                        onClick={() => toggleHero(post)}
                                        disabled={loading === post.id}
                                        title={post.is_hero ? "Quitar de portada" : "Poner en portada"}
                                    >
                                        ★
                                    </button>
                                    <button
                                        className="dash-btn dash-btn--danger"
                                        onClick={() => deletePost(post)}
                                        disabled={loading === post.id}
                                        title="Eliminar"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
