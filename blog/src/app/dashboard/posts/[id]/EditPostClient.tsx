"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category { id: string; name: string; slug: string; }
interface Author   { id: string; name: string; slug: string; }

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string;
    category_id: string;
    author_id: string;
    reading_time: number;
    keywords: string[];
    is_featured: boolean;
    is_hero: boolean;
    status: string;
}

export function EditPostClient({ post }: { post: Post }) {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [authors, setAuthors]       = useState<Author[]>([]);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState("");
    const [success, setSuccess]       = useState(false);

    const [form, setForm] = useState({
        title:          post.title,
        slug:           post.slug,
        excerpt:        post.excerpt,
        content:        post.content,
        featured_image: post.featured_image || "",
        category_id:    post.category_id,
        author_id:      post.author_id,
        reading_time:   String(post.reading_time || 5),
        keywords:       (post.keywords || []).join(", "),
        status:         post.status,
        is_featured:    post.is_featured,
        is_hero:        post.is_hero,
    });

    useEffect(() => {
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
        });
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            const res = await fetch(`/api/dashboard/posts/${post.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title:          form.title,
                    slug:           form.slug,
                    excerpt:        form.excerpt,
                    content:        form.content,
                    featured_image: form.featured_image,
                    image_alt:      form.title,
                    category_id:    form.category_id,
                    author_id:      form.author_id,
                    reading_time:   parseInt(form.reading_time) || 5,
                    keywords:       form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
                    is_featured:    form.is_featured,
                    is_hero:        form.is_hero,
                    status:         form.status,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Error al guardar");
            setSuccess(true);
            setTimeout(() => router.push("/dashboard/posts"), 1200);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="dash-form">
            {error   && <div className="dash-error-msg">{error}</div>}
            {success && <div className="dash-success-msg">¡Post guardado! Redirigiendo…</div>}

            <div className="dash-form-group">
                <label htmlFor="title">Título *</label>
                <input
                    id="title"
                    className="dash-input"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
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
                    <label htmlFor="category_id">Categoría *</label>
                    <select
                        id="category_id"
                        className="dash-select"
                        value={form.category_id}
                        onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                        required
                    >
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="dash-form-group">
                    <label htmlFor="author_id">Autor *</label>
                    <select
                        id="author_id"
                        className="dash-select"
                        value={form.author_id}
                        onChange={(e) => setForm((f) => ({ ...f, author_id: e.target.value }))}
                        required
                    >
                        {authors.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
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
                    {saving ? "Guardando…" : "Guardar cambios"}
                </button>
                <Link href="/dashboard/posts" className="dash-btn">Cancelar</Link>
            </div>
        </form>
    );
}
