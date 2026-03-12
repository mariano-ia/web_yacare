import { getAllArticlesForSitemap, getAllCategorySlugs } from "@/lib/queries";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/blog";

    const [articles, categorySlugs] = await Promise.all([
        getAllArticlesForSitemap(),
        getAllCategorySlugs(),
    ]);

    // Build a map: articleId → article for cross-referencing translations
    const articleById = new Map(articles.map((a) => [a.id, a]));

    const articleEntries: MetadataRoute.Sitemap = articles.map((a) => {
        const languages: Record<string, string> = {
            [a.lang]: `${siteUrl}/${a.lang}/${a.slug}`,
        };

        // Find translation partner
        if (a.translation_of) {
            const original = articleById.get(a.translation_of);
            if (original) {
                languages[original.lang] = `${siteUrl}/${original.lang}/${original.slug}`;
            }
        } else {
            const translation = articles.find((t) => t.translation_of === a.id);
            if (translation) {
                languages[translation.lang] = `${siteUrl}/${translation.lang}/${translation.slug}`;
            }
        }

        return {
            url: `${siteUrl}/${a.lang}/${a.slug}`,
            lastModified: new Date(a.updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.8,
            alternates: { languages },
        };
    });

    const langs = ["es", "en"] as const;

    const categoryEntries: MetadataRoute.Sitemap = langs.flatMap((lang) =>
        categorySlugs.map((slug) => ({
            url: `${siteUrl}/${lang}/categoria/${slug}`,
            changeFrequency: "weekly" as const,
            priority: 0.6,
            alternates: {
                languages: Object.fromEntries(
                    langs.map((l) => [l, `${siteUrl}/${l}/categoria/${slug}`])
                ),
            },
        }))
    );

    const homeEntries: MetadataRoute.Sitemap = langs.map((lang) => ({
        url: `${siteUrl}/${lang}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
        alternates: {
            languages: Object.fromEntries(
                langs.map((l) => [l, `${siteUrl}/${l}`])
            ),
        },
    }));

    return [
        ...homeEntries,
        ...categoryEntries,
        ...articleEntries,
    ];
}
