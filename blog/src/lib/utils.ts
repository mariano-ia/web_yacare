// src/lib/utils.ts
export function formatDate(dateStr: string, lang: string = "es"): string {
    if (!dateStr) return "";
    const cleanDateStr = dateStr.trim();
    const d = new Date(cleanDateStr);

    if (isNaN(d.getTime())) {
        return cleanDateStr; // Fallback to raw string if invalid
    }

    const locale = lang === "es" ? "es-AR" : "en-US";

    return d.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

export function formatDateLong(dateStr: string, lang: string = "es"): string {
    if (!dateStr) return "";
    const cleanDateStr = dateStr.trim();
    const d = new Date(cleanDateStr);

    if (isNaN(d.getTime())) {
        return cleanDateStr;
    }

    const locale = lang === "es" ? "es-AR" : "en-US";

    return d.toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}
