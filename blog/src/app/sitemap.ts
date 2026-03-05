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
        url: `${siteUrl}/${a.slug}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
        url: `${siteUrl}/categoria/${slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    return [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        ...categoryEntries,
        ...articleEntries,
    ];
}
