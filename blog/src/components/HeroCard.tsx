"use client";

import Link from "next/link";
import Image from "next/image";
import type { ArticleWithRelations } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";


export function HeroCard({ article }: { article: ArticleWithRelations }) {
    const { t, lang } = useI18n();

    return (
        <Link href={`/${article.slug}`} className="ep-hero">
            <Image
                src={article.featured_image}
                alt={article.image_alt || article.title}
                className="ep-hero__img"
                width={1200}
                height={550}
                priority
            />
            <div className="ep-hero__overlay" aria-hidden="true" />
            <div className="ep-hero__content">
                <div className="ep-hero__cat">
                    <span className={`ep-cat ep-cat--${article.category.color}`}>
                        {t(`categories.${article.category.slug}`) || article.category.name}
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
                    <span className="ep-hero__date">{formatDate(article.published_at, lang)}</span>
                    <span className="ep-hero__dot" aria-hidden="true" />
                    <span className="ep-hero__date">{article.reading_time} {t("article.reading_time")}</span>
                </div>
            </div>
        </Link>
    );
}
