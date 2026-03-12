import { NextResponse } from "next/server";
import { getRecentArticlesForNewsSitemap } from "@/lib/queries";

// Revalidate every 15 minutes — Google News crawls frequently
export const revalidate = 900;

export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/blog";
    const articles = await getRecentArticlesForNewsSitemap();

    const urls = articles
        .map((a) => {
            const keywords = a.keywords?.length
                ? `<news:keywords>${a.keywords.join(", ")}</news:keywords>`
                : "";
            return `  <url>
    <loc>${siteUrl}/${a.lang}/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>El Pantano</news:name>
        <news:language>${a.lang}</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.published_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
      ${keywords}
    </news:news>
  </url>`;
        })
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
        },
    });
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
