import type { Lang } from "./types";

export function articlePath(slug: string, lang: Lang = "es") {
    return `/${lang}/${slug}`;
}

export function categoryPath(slug: string, lang: Lang = "es") {
    return `/${lang}/categoria/${slug}`;
}

export function authorPath(slug: string, lang: Lang = "es") {
    return `/${lang}/autor/${slug}`;
}

export function homePath(lang: Lang = "es") {
    return `/${lang}`;
}
