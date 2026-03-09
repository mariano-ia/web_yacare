import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { ViewTracker } from "@/components/ViewTracker";
import { formatDateLong } from "@/lib/utils";
import {
    getArticleBySlug,
    getAllArticleSlugs,
    getRelatedArticles,
} from "@/lib/queries";
import { getServerTranslation, getServerLang } from "@/lib/translations";

// ISR: revalidate every 1 hour as fallback
export const revalidate = 3600;

// Pre-generate all article pages at build time
export async function generateStaticParams() {
    const slugs = await getAllArticleSlugs();
    return slugs.map((slug) => ({ slug }));
}

// Dynamic metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (!article) return {};

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano";

    return {
        title: article.title,
        description: article.excerpt,
        keywords: article.keywords?.length ? article.keywords.join(", ") : undefined,
        alternates: {
            canonical: `${siteUrl}/${article.slug}`,
        },
        openGraph: {
            title: article.title,
            description: article.excerpt,
            type: "article",
            url: `${siteUrl}/${article.slug}`,
            images: article.featured_image
                ? [{ url: article.featured_image, width: 1200, height: 630, alt: article.title }]
                : [],
            publishedTime: article.published_at,
            authors: [article.author.name],
            section: article.category.name,
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.excerpt,
            images: article.featured_image ? [article.featured_image] : [],
        },
        other: {
            "article:author": article.author.name,
            "article:published_time": article.published_at,
            "article:section": article.category.name,
        },
    };
}

export default async function ArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (!article) notFound();

    const related = await getRelatedArticles(article.category_id, article.slug, 3);
    const t = await getServerTranslation();
    const lang = await getServerLang();

    // JSON-LD structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        author: {
            "@type": "Person",
            name: article.author.name,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/blog"}/autor/${article.author.slug}`,
            jobTitle: article.author.role,
        },
        publisher: {
            "@type": "Organization",
            name: "El Pantano",
            url: process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano",
        },
        datePublished: article.published_at,
        dateModified: article.updated_at,
        articleSection: article.category.name,
        keywords: article.keywords,
        image: article.featured_image,
    };

    const faqLd = article.faq?.length
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: article.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
        }
        : null;

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "El Pantano",
                item: process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano",
            },
            {
                "@type": "ListItem",
                position: 2,
                name: article.category.name,
                item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano"}/categoria/${article.category.slug}`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: article.title,
            },
        ],
    };

    return (
        <>
            <Nav />
            <ViewTracker slug={slug} />

            <main>
                {/* Breadcrumb */}
                <nav className="ep-breadcrumb" aria-label={t("article.location")}>
                    <Link href="/">El Pantano</Link>
                    <span className="ep-breadcrumb__sep" aria-hidden="true">›</span>
                    <Link href={`/categoria/${article.category.slug}`}>{t(`categories.${article.category.slug}`) || article.category.name}</Link>
                    <span className="ep-breadcrumb__sep" aria-hidden="true">›</span>
                    <span>{article.title}</span>
                </nav>

                {/* Article Header */}
                <header className="ep-article-head">
                    <div className="ep-article-head__cat">
                        <Link
                            href={`/categoria/${article.category.slug}`}
                            className={`ep-cat ep-cat--${article.category.color}`}
                        >
                            {t(`categories.${article.category.slug}`) || article.category.name}
                        </Link>
                    </div>
                    <h1 className="ep-article-head__title">{article.title}</h1>
                    <p className="ep-article-head__standfirst">{article.excerpt}</p>
                    <div className="ep-article-head__meta">
                        <Link href={`/autor/${article.author.slug}`} className="ep-article-head__author">
                            <div className="ep-article-head__avatar" aria-hidden="true">
                                {article.author.avatar_initial}
                            </div>
                            <span className="ep-article-head__author-name">{article.author.name}</span>
                        </Link>
                        <span className="ep-meta-dot" aria-hidden="true" />
                        <time className="ep-meta-text" dateTime={article.published_at}>
                            {formatDateLong(article.published_at, lang)}
                        </time>
                        <span className="ep-meta-dot" aria-hidden="true" />
                        <span className="ep-meta-text">{article.reading_time} {t("article.reading_time")}</span>

                        <div className="ep-article-head__share" aria-label={t("article.share_article")}>
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/${article.slug}`)}`} target="_blank" rel="noopener" className="ep-share-btn" aria-label={t("article.share_twitter")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/${article.slug}`)}`} target="_blank" rel="noopener" className="ep-share-btn" aria-label={t("article.share_linkedin")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </header>


                {/* Article Body + Sidebar */}
                <div className="ep-article-wrap">
                    <div className="ep-article-col">

                        {/* In-article ad */}
                        <div className="ep-ad ep-ad--leaderboard" role="complementary" style={{ width: "100%", margin: "var(--space-6) 0" }}>
                            <span className="ep-ad__label">{t("sections.ad")}</span>
                            <div className="ep-ad__slot">728 × 90</div>
                        </div>
                        {/* Article content */}
                        <div
                            className="ep-prose"
                            dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(article.content, {
                                    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4", "h5", "h6"]),
                                    allowedAttributes: {
                                        ...sanitizeHtml.defaults.allowedAttributes,
                                        "img": ["src", "alt", "class", "width", "height"],
                                        "*": ["class", "id"],
                                    },
                                })
                            }}
                        />
                    </div>

                    {/* Sticky sidebar */}
                    <aside className="ep-article-sidebar">
                        {/* Author mini */}
                        <div className="ep-author-mini">
                            <div className="ep-author-mini__top">
                                <div className="ep-author-mini__avatar" aria-hidden="true">
                                    {article.author.avatar_initial}
                                </div>
                                <div>
                                    <div className="ep-author-mini__name">{article.author.name}</div>
                                    <div className="ep-author-mini__role">{article.author.role}</div>
                                </div>
                            </div>
                            <p className="ep-author-mini__bio">{article.author.bio}</p>
                        </div>

                        {/* Ad */}
                        <div className="ep-ad ep-ad--mrect" role="complementary">
                            <span className="ep-ad__label">{t("sections.ad")}</span>
                            <div className="ep-ad__slot">300 × 250</div>
                        </div>
                    </aside>
                </div>

                {/* Author full card */}
                <div className="ep-author-card">
                    <div className="ep-author-card__inner">
                        <div className="ep-author-card__avatar" aria-hidden="true">
                            {article.author.avatar_initial}
                        </div>
                        <div>
                            <div className="ep-author-card__label">{t("article.author")}</div>
                            <Link href={`/autor/${article.author.slug}`} className="ep-author-card__name" style={{ textDecoration: "none", color: "inherit" }}>{article.author.name}</Link>
                            <div className="ep-author-card__role">{article.author.role}</div>
                            <p className="ep-author-card__bio">{article.author.bio}</p>
                        </div>
                    </div>
                </div>

                {/* FAQ section */}
                {article.faq?.length > 0 && (
                    <div className="ep-faq">
                        <div className="ep-section-head" style={{ marginBottom: "var(--space-5)" }}>
                            <span className="ep-section-head__bar ep-section-head__bar--purple" />
                            <h2 className="ep-section-head__label">Preguntas frecuentes</h2>
                        </div>
                        <dl className="ep-faq__list">
                            {article.faq.map((item, i) => (
                                <div key={i} className="ep-faq__item">
                                    <dt className="ep-faq__question">{item.question}</dt>
                                    <dd className="ep-faq__answer">{item.answer}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                )}

                {/* Related posts */}
                {related.length > 0 && (
                    <div className="ep-related">
                        <div className="ep-section-head" style={{ marginBottom: "var(--space-6)" }}>
                            <span className="ep-section-head__bar ep-section-head__bar--green" />
                            <span className="ep-section-head__label">{t("article.more_from")}</span>
                        </div>
                        <div className="ep-card-grid">
                            {related.map((r) => (
                                <ArticleCard key={r.id} article={r} variant="standard" />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            {faqLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
                />
            )}

            <Footer />
        </>
    );
}
