import { getAllArticlesForSitemap, getAllCategorySlugs } from "@/lib/queries";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano";

    const [articles, categorySlugs] = await Promise.all([
        getAllArticlesForSitemap(),
        getAllCategorySlugs(),
    ]);

    const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
        url: `${siteUrl}/${a.lang}/${a.slug}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    const langs = ["es", "en"] as const;

    const categoryEntries: MetadataRoute.Sitemap = langs.flatMap((lang) =>
        categorySlugs.map((slug) => ({
            url: `${siteUrl}/${lang}/categoria/${slug}`,
            changeFrequency: "weekly" as const,
            priority: 0.6,
        }))
    );

    const homeEntries: MetadataRoute.Sitemap = langs.map((lang) => ({
        url: `${siteUrl}/${lang}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
    }));

    return [
        ...homeEntries,
        ...categoryEntries,
        ...articleEntries,
    ];
}
