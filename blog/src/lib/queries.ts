import { supabase } from "./supabase";
import type { ArticleWithRelations, Author, Category } from "./types";

// ─── Helpers ────────────────────────────────────────────────

const ARTICLE_SELECT = `
  *,
  category:categories(*),
  author:authors(*)
`;

/** Returns empty array if supabase is not configured */
function ensureClient() {
    if (!supabase) {
        console.warn("[queries] Supabase not configured — returning empty data");
        return null;
    }
    return supabase;
}

// ─── Articles ───────────────────────────────────────────────

/** Get all published articles ordered by date */
export async function getArticles(limit?: number): Promise<ArticleWithRelations[]> {
    const sb = ensureClient();
    if (!sb) return [];

    let query = sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .order("published_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data as ArticleWithRelations[]) ?? [];
}

/** Get the hero article (is_hero = true, or fallback: latest published) */
export async function getHeroArticle(): Promise<ArticleWithRelations | null> {
    const sb = ensureClient();
    if (!sb) return null;

    // Try explicit hero first
    const { data: heroData, error: heroError } = await sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .eq("is_hero", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .single();

    if (heroData) return heroData as ArticleWithRelations;
    if (heroError && heroError.code !== "PGRST116") throw heroError;

    // Fallback: latest published article becomes hero
    const { data: latestData, error: latestError } = await sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(1)
        .single();

    if (latestError && latestError.code !== "PGRST116") throw latestError;
    return (latestData as ArticleWithRelations) ?? null;
}

/** Get featured articles (excluding hero) */
export async function getFeaturedArticles(limit = 2): Promise<ArticleWithRelations[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data, error } = await sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .eq("is_featured", true)
        .eq("is_hero", false)
        .order("published_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data as ArticleWithRelations[]) ?? [];
}

/** Get latest articles (not featured, not hero) */
export async function getLatestArticles(limit = 3): Promise<ArticleWithRelations[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data, error } = await sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .eq("is_featured", false)
        .eq("is_hero", false)
        .order("published_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data as ArticleWithRelations[]) ?? [];
}

/** Get a single article by slug */
export async function getArticleBySlug(slug: string): Promise<ArticleWithRelations | null> {
    const sb = ensureClient();
    if (!sb) return null;

    const { data, error } = await sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (error && error.code !== "PGRST116") throw error;
    return (data as ArticleWithRelations) ?? null;
}

/** Get all article slugs (for generateStaticParams) */
export async function getAllArticleSlugs(): Promise<string[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data, error } = await sb
        .from("articles")
        .select("slug")
        .eq("status", "published");

    if (error) throw error;
    return data?.map((a) => a.slug) ?? [];
}

/** Get articles by category slug */
export async function getArticlesByCategory(
    categorySlug: string,
    limit?: number
): Promise<ArticleWithRelations[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data: cat } = await sb
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

    if (!cat) return [];

    let query = sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .eq("category_id", cat.id)
        .order("published_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data as ArticleWithRelations[]) ?? [];
}

/** Get related articles (same category, exclude current) */
export async function getRelatedArticles(
    categoryId: string,
    excludeSlug: string,
    limit = 3
): Promise<ArticleWithRelations[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data, error } = await sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .eq("category_id", categoryId)
        .neq("slug", excludeSlug)
        .order("published_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data as ArticleWithRelations[]) ?? [];
}

/** Get most-read articles (ordered by view_count, fallback to latest) */
export async function getMostReadArticles(limit = 5): Promise<ArticleWithRelations[]> {
    const sb = ensureClient();
    if (!sb) return [];

    // Try ordering by view_count; if column doesn't exist yet, fallback to date
    const { data, error } = await sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(limit);

    if (error) {
        // Fallback: view_count column might not exist yet
        const { data: fallback, error: fallbackError } = await sb
            .from("articles")
            .select(ARTICLE_SELECT)
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(limit);

        if (fallbackError) throw fallbackError;
        return (fallback as ArticleWithRelations[]) ?? [];
    }

    return (data as ArticleWithRelations[]) ?? [];
}

// ─── Categories ─────────────────────────────────────────────

/** Get all categories */
export async function getCategories(): Promise<Category[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data, error } = await sb
        .from("categories")
        .select("*")
        .order("name");

    if (error) throw error;
    return (data as Category[]) ?? [];
}

/** Get category by slug */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const sb = ensureClient();
    if (!sb) return null;

    const { data, error } = await sb
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error && error.code !== "PGRST116") throw error;
    return (data as Category) ?? null;
}

/** Get all category slugs */
export async function getAllCategorySlugs(): Promise<string[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data, error } = await sb
        .from("categories")
        .select("slug");

    if (error) throw error;
    return data?.map((c) => c.slug) ?? [];
}

// ─── Authors ────────────────────────────────────────────────

/** Get author by slug */
export async function getAuthorBySlug(slug: string): Promise<Author | null> {
    const sb = ensureClient();
    if (!sb) return null;

    const { data, error } = await sb
        .from("authors")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error && error.code !== "PGRST116") throw error;
    return (data as Author) ?? null;
}

/** Get all published articles by a specific author */
export async function getArticlesByAuthor(
    authorSlug: string
): Promise<ArticleWithRelations[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data: author } = await sb
        .from("authors")
        .select("id")
        .eq("slug", authorSlug)
        .single();

    if (!author) return [];

    const { data, error } = await sb
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .eq("author_id", author.id)
        .order("published_at", { ascending: false });

    if (error) throw error;
    return (data as ArticleWithRelations[]) ?? [];
}

/** Get all author slugs for static generation */
export async function getAllAuthorSlugs(): Promise<string[]> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data, error } = await sb
        .from("authors")
        .select("slug");

    if (error) throw error;
    return (data ?? []).map((a) => a.slug);
}

/** Get all published articles for sitemap */
export async function getAllArticlesForSitemap(): Promise<
    { slug: string; updated_at: string }[]
> {
    const sb = ensureClient();
    if (!sb) return [];

    const { data, error } = await sb
        .from("articles")
        .select("slug, updated_at")
        .eq("status", "published");

    if (error) throw error;
    return data ?? [];
}

/** Get articles published in the last 48h for Google News sitemap */
export async function getRecentArticlesForNewsSitemap(): Promise<
    { slug: string; title: string; published_at: string; keywords: string[] }[]
> {
    const sb = ensureClient();
    if (!sb) return [];

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb
        .from("articles")
        .select("slug, title, published_at, keywords")
        .eq("status", "published")
        .gte("published_at", cutoff)
        .order("published_at", { ascending: false })
        .limit(1000);

    if (error) throw error;
    return data ?? [];
}
