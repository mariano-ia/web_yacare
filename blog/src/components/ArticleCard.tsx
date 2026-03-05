import type { ArticleWithRelations } from "@/lib/types";
import { formatDate } from "@/lib/utils";


/** Standard card — used in grids (featured, latest, explore, related) */
export function ArticleCard({
    article,
    variant = "standard",
}: {
    article: ArticleWithRelations;
    variant?: "featured" | "standard" | "compact";
}) {
    if (variant === "compact") {
        return (
            <a href={`/${article.slug}`} className="ep-card ep-card--compact">
                <div className="ep-card__thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={article.featured_image}
                        alt={article.image_alt || article.title}
                        className="ep-card__img"
                        loading="lazy"
                    />
                </div>
                <div>
                    <h4 className="ep-card__title">{article.title}</h4>
                    <div className="ep-card__meta" style={{ marginTop: 4 }}>
                        <span className="ep-card__date">{formatDate(article.published_at)}</span>
                    </div>
                </div>
            </a>
        );
    }

    return (
        <a
            href={`/${article.slug}`}
            className={`ep-card ep-card--${variant}`}
            data-cat={article.category.color}
        >
            <div className="ep-card__thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={article.featured_image}
                    alt={article.image_alt || article.title}
                    className="ep-card__img"
                    loading="lazy"
                />
            </div>
            <div className="ep-card__cat">
                <span className={`ep-cat ep-cat--${article.category.color}`}>
                    {article.category.name}
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
                <span className="ep-card__date">{formatDate(article.published_at)}</span>
            </div>
        </a>
    );
}
