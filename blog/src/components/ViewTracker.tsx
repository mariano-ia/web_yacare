"use client";

import { useEffect } from "react";

/** Fires a single POST to /api/views on mount to track article reads */
export function ViewTracker({ slug }: { slug: string }) {
    useEffect(() => {
        // Fire-and-forget — no need to await
        fetch("/api/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
        }).catch(() => {
            // Silently ignore tracking errors
        });
    }, [slug]);

    return null;
}
