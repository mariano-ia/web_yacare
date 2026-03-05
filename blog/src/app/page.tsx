import type { Metadata } from "next";
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

// ISR: revalidate every 1 hour as fallback (on-demand revalidation is primary)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "El Pantano — Tecnología, Cultura y Opinión",
  description:
    "El Pantano es una publicación digital de múltiples voces. Tecnología, cultura, IA, análisis y opinión sin filtro.",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano",
  },
  openGraph: {
    title: "El Pantano",
    description: "Muchas voces. Un solo charco.",
    type: "website",
  },
};

export default async function HomePage() {
  const [hero, featured, latest, allArticles, mostRead] = await Promise.all([
    getHeroArticle(),
    getFeaturedArticles(2),
    getLatestArticles(3),
    getArticles(20),
    getMostReadArticles(5),
  ]);

  return (
    <>
      <Nav />

      {/* Hero */}
      {hero && <HeroCard article={hero} />}

      {/* Ad Leaderboard */}
      <div className="ep-ad ep-ad--leaderboard" role="complementary">
        <span className="ep-ad__label">Publicidad</span>
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
              <span className="ep-section-head__label">Destacados</span>
            </div>
            <div className="ep-featured-pair">
              {featured.map((article) => (
                <ArticleCard key={article.id} article={article} variant="featured" />
              ))}
            </div>

            {/* Latest */}
            <div className="ep-section-head">
              <span className="ep-section-head__bar ep-section-head__bar--green" />
              <span className="ep-section-head__label">Lo último</span>
              <a href="#" className="ep-section-head__more">Ver todo →</a>
            </div>
            <div className="ep-card-grid" style={{ marginBottom: "var(--space-6)" }}>
              {latest.map((article) => (
                <ArticleCard key={article.id} article={article} variant="standard" />
              ))}
            </div>

            {/* In-feed ad */}
            <div className="ep-ad ep-ad--infeed" role="complementary">
              <span className="ep-ad__label">Publicidad</span>
              <div className="ep-ad__slot">In-feed · Responsive</div>
            </div>

            {/* Explore with category filter */}
            <div className="ep-section-head" style={{ marginTop: "var(--space-5)" }}>
              <span className="ep-section-head__bar ep-section-head__bar--purple" />
              <span className="ep-section-head__label">Explorar</span>
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
