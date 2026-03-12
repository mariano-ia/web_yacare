import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import {
    getCategoryBySlug,
    getArticlesByCategory,
    getAllCategorySlugs,
} from "@/lib/queries";
import { getServerTranslation } from "@/lib/translations";

export const revalidate = 3600;

export async function generateStaticParams() {
    const slugs = await getAllCategorySlugs();
    return ["es", "en"].flatMap((lang) =>
        slugs.map((slug) => ({ lang, slug }))
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
    const { lang, slug } = await params;
    const category = await getCategoryBySlug(slug);
    if (!category) return {};

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/blog";
    const articles = await getArticlesByCategory(category.slug, 1, lang);
    const ogImage = articles[0]?.featured_image ?? null;

    return {
        title: `${category.name} — El Pantano`,
        description: `Artículos de ${category.name} en El Pantano. Tecnología, cultura, IA y opinión sin filtro.`,
        alternates: {
            canonical: `${siteUrl}/${lang}/categoria/${category.slug}`,
            languages: {
                es: `${siteUrl}/es/categoria/${category.slug}`,
                en: `${siteUrl}/en/categoria/${category.slug}`,
            },
        },
        openGraph: {
            title: `${category.name} — El Pantano`,
            description: `Todo sobre ${category.name} en El Pantano.`,
            type: "website",
            locale: lang === "es" ? "es_AR" : "en_US",
            url: `${siteUrl}/${lang}/categoria/${category.slug}`,
            ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: `${category.name} — El Pantano` }] }),
        },
        twitter: {
            card: "summary_large_image",
            title: `${category.name} — El Pantano`,
            description: `Todo sobre ${category.name} en El Pantano.`,
            ...(ogImage && { images: [ogImage] }),
        },
    };
}

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ lang: string; slug: string }>;
}) {
    const { lang, slug } = await params;
    const category = await getCategoryBySlug(slug);
    if (!category) notFound();

    const articles = await getArticlesByCategory(slug, undefined, lang);
    const t = await getServerTranslation();

    return (
        <>
            <Nav />

            <main>
                <div className="ep-main" style={{ paddingTop: "var(--space-8)" }}>
                    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 var(--space-4)" }}>
                        <div className="ep-section-head" style={{ marginBottom: "var(--space-6)" }}>
                            <span className={`ep-section-head__bar ep-section-head__bar--green`} />
                            <h1 className="ep-section-head__label">{t(`categories.${category.slug}`) || category.name}</h1>
                        </div>

                        {articles.length === 0 ? (
                            <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "var(--space-8) 0" }}>
                                {t("sections.category_empty")}
                            </p>
                        ) : (
                            <div className="ep-card-grid">
                                {articles.map((article) => (
                                    <ArticleCard key={article.id} article={article} variant="standard" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
