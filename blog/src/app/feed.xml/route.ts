import { getArticles } from "@/lib/queries";

export const revalidate = 3600;

export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano";
    const articles = await getArticles(50);

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>El Pantano</title>
    <description>Muchas voces. Un solo charco. Tecnología, cultura, IA y opinión sin filtro.</description>
    <link>${siteUrl}</link>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles
            .map(
                (a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <description><![CDATA[${a.excerpt}]]></description>
      <link>${siteUrl}/${a.slug}</link>
      <guid isPermaLink="true">${siteUrl}/${a.slug}</guid>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      <dc:creator>${a.author.name}</dc:creator>
      <category>${a.category.name}</category>
    </item>`
            )
            .join("")}
  </channel>
</rss>`;

    return new Response(rss, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
    });
}
