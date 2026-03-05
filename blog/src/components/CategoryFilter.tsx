"use client";

import { useState } from "react";
import type { ArticleWithRelations } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";

const FILTERS = [
    { label: "Todo", value: "all" },
    { label: "Tecnología", value: "tecnologia" },
    { label: "IA", value: "ia" },
    { label: "Análisis", value: "analisis" },
    { label: "Cultura", value: "cultura" },
    { label: "Negocios", value: "negocios" },
    { label: "Opinión", value: "opinion" },
];

export function CategoryFilter({ articles }: { articles: ArticleWithRelations[] }) {
    const [active, setActive] = useState("all");

    const filtered =
        active === "all"
            ? articles
            : articles.filter((a) => a.category.color === active);

    return (
        <>
            <div className="ep-cat-filter" role="group" aria-label="Filtrar por categoría">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        className={`ep-cat-filter__btn ${active === f.value ? "active" : ""}`}
                        onClick={() => setActive(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
            <div className="ep-card-grid ep-filterable-grid">
                {filtered.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="standard" />
                ))}
            </div>
        </>
    );
}
