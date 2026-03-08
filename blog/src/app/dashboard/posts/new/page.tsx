"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category { id: string; name: string; slug: string; }
interface Author   { id: string; name: string; slug: string; }

const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET ?? "";

export default function NewPostPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        featured_image: "",
        category: "",
        author: "",
        reading_time: "5",
        keywords: "",
        status: "published",
        is_featured: false,
        is_hero: false,
    });

    useEffect(() => {
        Promise.all([
            fetch("/blog/api/dashboard/stats").then(() => null), // warmup
            fetch("/blog/api/articles?limit=1").then(() => null), // warmup
        ]);
        // Load categories and authors directly from Supabase anon key
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        Promise.all([
            fetch(`${url}/rest/v1/categories?select=id,name,slug&order=name`, {
                headers: { apikey: key, Authorization: `Bearer ${key}` },
            }).then((r) => r.json()),
            fetch(`${url}/rest/v1/authors?select=id,name,slug&order=name`, {
                headers: { apikey: key, Authorization: `Bearer ${key}` },
            }).then((r) => r.json()),
        ]).then(([cats, auths]) => {
            setCategories(cats ?? []);
            setAuthors(auths ?? []);
            if (cats?.length) setForm((f) => ({ ...f, category: cats[0].slug }));
            if (auths?.length) setForm((f) => ({ ...f, author: auths[0].slug }));
        });
    }, []);

    // Auto-generate slug from title
    function handleTitle(val: string) {
        const slug = val
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");
        setForm((f) => ({ ...f, title: val, slug }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const payload = {
                title: form.title,
                slug: form.slug,
                excerpt: form.excerpt,
                content: form.content,
                featured_image: form.featured_image,
                image_alt: form.title,
                category: form.category,
                author: form.author,
                reading_time: parseInt(form.reading_time) || 5,
                keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
                is_featured: form.is_featured,
                is_hero: form.is_hero,
                status: form.status,
            };

            const res = await fetch("/blog/api/articles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_SECRET || "ep_n8n_secret_2026_xK9mP4"}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Error al crear el post");

            setSuccess(true);
            setTimeout(() => router.push("/dashboard/posts"), 1200);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Crear post</h1>
                    <p className="dash-page-subtitle">Nuevo artículo manual</p>
                </div>
                <Link href="/dashboard/posts" className="dash-btn">← Volver</Link>
            </div>

            <div className="dash-section">
                <div style={{ padding: "24px" }}>
                    <form onSubmit={handleSubmit} className="dash-form">

                        {error && <div className="dash-error-msg">{error}</div>}
                        {success && <div className="dash-success-msg">¡Post creado! Redirigiendo…</div>}

                        <div className="dash-form-group">
                            <label htmlFor="title">Título *</label>
                            <input
                                id="title"
                                className="dash-input"
                                value={form.title}
                                onChange={(e) => handleTitle(e.target.value)}
                                required
                                placeholder="Título del artículo"
                            />
                        </div>

                        <div className="dash-form-group">
                            <label htmlFor="slug">Slug *</label>
                            <input
                                id="slug"
                                className="dash-input"
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                required
                                placeholder="url-del-articulo"
                            />
                        </div>

                        <div className="dash-form-group">
                            <label htmlFor="excerpt">Bajada / Excerpt *</label>
                            <textarea
                                id="excerpt"
                                className="dash-textarea"
                                value={form.excerpt}
                                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                                required
                                placeholder="Resumen del artículo (1-2 oraciones)"
                            />
                        </div>

                        <div className="dash-form-group">
                            <label htmlFor="content">Contenido (HTML) *</label>
                            <textarea
                                id="content"
                                className="dash-textarea dash-textarea--content"
                                value={form.content}
                                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                                required
                                placeholder="<p>Contenido del artículo en HTML…</p>"
                            />
                        </div>

                        <div className="dash-form-group">
                            <label htmlFor="featured_image">URL imagen destacada</label>
                            <input
                                id="featured_image"
                                className="dash-input"
                                value={form.featured_image}
                                onChange={(e) => setForm((f) => ({ ...f, featured_image: e.target.value }))}
                                placeholder="https://…"
                            />
                        </div>

                        <div className="dash-form-row">
                            <div className="dash-form-group">
                                <label htmlFor="category">Categoría *</label>
                                <select
                                    id="category"
                                    className="dash-select"
                                    value={form.category}
                                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                    required
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.slug}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="dash-form-group">
                                <label htmlFor="author">Autor *</label>
                                <select
                                    id="author"
                                    className="dash-select"
                                    value={form.author}
                                    onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                                    required
                                >
                                    {authors.map((a) => (
                                        <option key={a.id} value={a.slug}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="dash-form-row">
                            <div className="dash-form-group">
                                <label htmlFor="reading_time">Tiempo de lectura (min)</label>
                                <input
                                    id="reading_time"
                                    type="number"
                                    className="dash-input"
                                    value={form.reading_time}
                                    onChange={(e) => setForm((f) => ({ ...f, reading_time: e.target.value }))}
                                    min="1"
                                    max="60"
                                />
                            </div>

                            <div className="dash-form-group">
                                <label htmlFor="status">Estado</label>
                                <select
                                    id="status"
                                    className="dash-select"
                                    value={form.status}
                                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                                >
                                    <option value="published">Publicado</option>
                                    <option value="draft">Borrador</option>
                                </select>
                            </div>
                        </div>

                        <div className="dash-form-group">
                            <label htmlFor="keywords">Keywords (separadas por coma)</label>
                            <input
                                id="keywords"
                                className="dash-input"
                                value={form.keywords}
                                onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                                placeholder="IA, automatización, startups"
                            />
                        </div>

                        <div style={{ display: "flex", gap: 24 }}>
                            <div className="dash-toggle-row">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    checked={form.is_featured}
                                    onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                                />
                                <label htmlFor="is_featured">Destacado</label>
                            </div>
                            <div className="dash-toggle-row">
                                <input
                                    type="checkbox"
                                    id="is_hero"
                                    checked={form.is_hero}
                                    onChange={(e) => setForm((f) => ({ ...f, is_hero: e.target.checked }))}
                                />
                                <label htmlFor="is_hero">Portada (hero)</label>
                            </div>
                        </div>

                        <div className="dash-form-footer">
                            <button type="submit" className="dash-btn dash-btn--primary" disabled={saving}>
                                {saving ? "Guardando…" : "Publicar post"}
                            </button>
                            <Link href="/dashboard/posts" className="dash-btn">Cancelar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
