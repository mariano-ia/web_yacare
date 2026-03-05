// src/lib/utils.ts
export function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const cleanDateStr = dateStr.trim();
    const d = new Date(cleanDateStr);

    if (isNaN(d.getTime())) {
        return cleanDateStr; // Fallback to raw string if invalid
    }

    return d.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

export function formatDateLong(dateStr: string): string {
    if (!dateStr) return "";
    const cleanDateStr = dateStr.trim();
    const d = new Date(cleanDateStr);

    if (isNaN(d.getTime())) {
        return cleanDateStr;
    }

    return d.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}
