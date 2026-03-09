"use client";

import Link from "next/link";
import Image from "next/image";
import type { ArticleWithRelations } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";


/** Standard card — used in grids (featured, latest, explore, related) */
export function ArticleCard({
    article,
    variant = "standard",
}: {
    article: ArticleWithRelations;
    variant?: "featured" | "standard" | "compact";
}) {
    const { t, lang } = useI18n();

    if (variant === "compact") {
        return (
            <Link href={`/${article.slug}`} className="ep-card ep-card--compact">
                <div className="ep-card__thumb">
                    <Image
                        src={article.featured_image}
                        alt={article.image_alt || article.title}
                        fill
                        className="ep-card__img"
                        sizes="80px"
                    />
                </div>
                <div>
                    <h4 className="ep-card__title">{article.title}</h4>
                    <div className="ep-card__meta" style={{ marginTop: 4 }}>
                        <span className="ep-card__date">{formatDate(article.published_at, lang)}</span>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/${article.slug}`}
            className={`ep-card ep-card--${variant}`}
            data-cat={article.category.color}
        >
            <div className="ep-card__thumb">
                <Image
                    src={article.featured_image}
                    alt={article.image_alt || article.title}
                    fill
                    className="ep-card__img"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
            <div className="ep-card__cat">
                <span className={`ep-cat ep-cat--${article.category.color}`}>
                    {t(`categories.${article.category.slug}`) || article.category.name}
                </span>
            </div>
            {variant === "featured" ? (
                <>
                    <h2 className="ep-card__title">{article.title}</h2>
                    <p className="ep-card__excerpt">{article.excerpt}</p>
                </>
            ) : (
                <h3 className="ep-card__title">{article.title}</h3>
            )}
            <div className="ep-card__meta">
                <div className="ep-card__author-row">
                    <div className="ep-card__author-thumb" aria-hidden="true">
                        {article.author.avatar_initial}
                    </div>
                    <span className="ep-card__author-name">{article.author.name}</span>
                </div>
                <span className="ep-card__dot" aria-hidden="true" />
                <span className="ep-card__date">{formatDate(article.published_at, lang)}</span>
            </div>
        </Link>
    );
}
