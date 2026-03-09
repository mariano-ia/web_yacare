import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HeroCard } from "@/components/HeroCard";
import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { CategoryFilter } from "@/components/CategoryFilter";
import {
  getHeroArticle,
  getFeaturedArticles,
  getLatestArticles,
  getArticles,
  getMostReadArticles,
} from "@/lib/queries";
import { getServerTranslation } from "@/lib/translations";

// ISR: revalidate every 1 hour as fallback (on-demand revalidation is primary)
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslation();

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano",
    },
    openGraph: {
      title: t("meta.og_title"),
      description: t("meta.og_desc"),
      type: "website",
    },
  };
}

export default async function HomePage() {
  const [hero, featured, latest, allArticles, mostRead, t] = await Promise.all([
    getHeroArticle(),
    getFeaturedArticles(2),
    getLatestArticles(3),
    getArticles(20),
    getMostReadArticles(5),
    getServerTranslation(),
  ]);

  return (
    <>
      <Nav />

      {/* Hero */}
      {hero && <HeroCard article={hero} />}

      {/* Ad Leaderboard */}
      <div className="ep-ad ep-ad--leaderboard" role="complementary">
        <span className="ep-ad__label">{t("sections.ad")}</span>
        <div className="ep-ad__slot">728 × 90</div>
      </div>

      {/* Main editorial grid */}
      <div className="ep-main">
        <div className="ep-layout">
          {/* Left column: feed */}
          <div>
            {/* Featured pair */}
            <div className="ep-section-head">
              <span className="ep-section-head__bar ep-section-head__bar--white" />
              <span className="ep-section-head__label">{t("sections.featured")}</span>
            </div>
            <div className="ep-featured-pair">
              {featured.map((article) => (
                <ArticleCard key={article.id} article={article} variant="featured" />
              ))}
            </div>

            {/* Latest */}
            <div className="ep-section-head">
              <span className="ep-section-head__bar ep-section-head__bar--green" />
              <span className="ep-section-head__label">{t("sections.latest")}</span>
              <Link href="/categoria/tecnologia" className="ep-section-head__more">{t("sections.see_all")}</Link>
            </div>
            <div className="ep-card-grid" style={{ marginBottom: "var(--space-6)" }}>
              {latest.map((article) => (
                <ArticleCard key={article.id} article={article} variant="standard" />
              ))}
            </div>

            {/* In-feed ad */}
            <div className="ep-ad ep-ad--infeed" role="complementary">
              <span className="ep-ad__label">{t("sections.ad")}</span>
              <div className="ep-ad__slot">{t("sections.infeed")}</div>
            </div>

            {/* Explore with category filter */}
            <div className="ep-section-head" style={{ marginTop: "var(--space-5)" }}>
              <span className="ep-section-head__bar ep-section-head__bar--purple" />
              <span className="ep-section-head__label">{t("sections.explore")}</span>
            </div>
            <CategoryFilter articles={allArticles} />
          </div>

          {/* Right column: sidebar */}
          <Sidebar trending={mostRead.length > 0 ? mostRead : allArticles.slice(0, 5)} />
        </div>
      </div>

      <Footer />
    </>
  );
}
