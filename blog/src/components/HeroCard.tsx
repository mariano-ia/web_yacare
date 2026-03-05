import type { ArticleWithRelations } from "@/lib/types";
import { formatDate } from "@/lib/utils";


export function HeroCard({ article }: { article: ArticleWithRelations }) {
    return (
        <a href={`/${article.slug}`} className="ep-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={article.featured_image}
                alt={article.image_alt || article.title}
                className="ep-hero__img"
                loading="eager"
            />
            <div className="ep-hero__overlay" aria-hidden="true" />
            <div className="ep-hero__content">
                <div className="ep-hero__cat">
                    <span className={`ep-cat ep-cat--${article.category.color}`}>
                        {article.category.name}
                    </span>
                </div>
                <h1 className="ep-hero__title">{article.title}</h1>
                <p className="ep-hero__standfirst">{article.excerpt}</p>
                <div className="ep-hero__byline">
                    <div className="ep-hero__author-img" aria-hidden="true">
                        {article.author.avatar_initial}
                    </div>
                    <span className="ep-hero__author-name">{article.author.name}</span>
                    <span className="ep-hero__dot" aria-hidden="true" />
                    <span className="ep-hero__date">{formatDate(article.published_at)}</span>
                    <span className="ep-hero__dot" aria-hidden="true" />
                    <span className="ep-hero__date">{article.reading_time} min de lectura</span>
                </div>
            </div>
        </a>
    );
}
