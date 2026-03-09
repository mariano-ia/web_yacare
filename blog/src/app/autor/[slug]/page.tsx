import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import {
    getAuthorBySlug,
    getArticlesByAuthor,
    getAllAuthorSlugs,
} from "@/lib/queries";
import { getServerTranslation } from "@/lib/translations";

export const revalidate = 3600;

export async function generateStaticParams() {
    const slugs = await getAllAuthorSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const author = await getAuthorBySlug(slug);
    if (!author) return {};

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/blog";

    return {
        title: `${author.name} — El Pantano`,
        description: author.bio,
        alternates: {
            canonical: `${siteUrl}/autor/${author.slug}`,
        },
        openGraph: {
            title: `${author.name} — El Pantano`,
            description: author.bio,
            type: "profile",
            url: `${siteUrl}/autor/${author.slug}`,
        },
        twitter: {
            card: "summary",
            title: `${author.name} — El Pantano`,
            description: author.bio,
        },
    };
}

export default async function AuthorPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const [author, articles, t] = await Promise.all([
        getAuthorBySlug(slug),
        getArticlesByAuthor(slug),
        getServerTranslation(),
    ]);

    if (!author) notFound();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/blog";

    const personLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: author.name,
        url: `${siteUrl}/autor/${author.slug}`,
        description: author.bio,
        jobTitle: author.role,
        worksFor: {
            "@type": "Organization",
            name: "El Pantano",
            url: siteUrl,
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
            />
            <Nav />

            <main>
                <div className="ep-main" style={{ paddingTop: "var(--space-8)" }}>
                    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 var(--space-4)" }}>

                        {/* Author header */}
                        <div className="ep-author-page__header">
                            <div className="ep-author-page__avatar" aria-hidden="true">
                                {author.avatar_initial}
                            </div>
                            <div className="ep-author-page__info">
                                <h1 className="ep-author-page__name">{author.name}</h1>
                                <p className="ep-author-page__role">{author.role}</p>
                                <p className="ep-author-page__bio">{author.bio}</p>
                            </div>
                        </div>

                        {/* Articles by this author */}
                        {articles.length > 0 && (
                            <>
                                <div className="ep-section-head" style={{ marginBottom: "var(--space-6)", marginTop: "var(--space-8)" }}>
                                    <span className="ep-section-head__bar ep-section-head__bar--white" />
                                    <h2 className="ep-section-head__label">
                                        {t("article.more_from")} · {author.name}
                                    </h2>
                                </div>
                                <div className="ep-card-grid">
                                    {articles.map((article) => (
                                        <ArticleCard key={article.id} article={article} variant="standard" />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
