"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
    /** AdSense ad slot ID (e.g. "1234567890") */
    slot: string;
    /** Ad format: auto, rectangle, leaderboard, in-article, in-feed */
    format?: "auto" | "rectangle" | "horizontal" | "vertical" | "fluid";
    /** Responsive: true to let AdSense auto-size */
    responsive?: boolean;
    /** CSS class for the wrapper */
    className?: string;
    /** Custom style for the ins element */
    style?: React.CSSProperties;
}

/**
 * Google AdSense ad unit component.
 * 
 * To use:
 * 1. Get your AdSense Publisher ID (ca-pub-XXXXX) and set NEXT_PUBLIC_ADSENSE_ID env var
 * 2. Get approved by Google AdSense
 * 3. Create ad units in AdSense dashboard and use their slot IDs
 * 
 * Until AdSense is approved, this shows the existing placeholder.
 */
export function AdSlot({
    slot,
    format = "auto",
    responsive = true,
    className = "",
    style,
}: AdSlotProps) {
    const adRef = useRef<HTMLModElement>(null);
    const pubId = process.env.NEXT_PUBLIC_ADSENSE_ID;

    useEffect(() => {
        if (!pubId || !adRef.current) return;

        try {
            // Push ad only once
            const adsbygoogle = (window as any).adsbygoogle || [];
            adsbygoogle.push({});
        } catch (e) {
            console.error("[AdSlot] Error pushing ad:", e);
        }
    }, [pubId]);

    // If no AdSense ID configured, show placeholder
    if (!pubId) {
        return null; // Will fallback to the existing placeholder in the parent
    }

    return (
        <ins
            ref={adRef}
            className={`adsbygoogle ${className}`}
            style={style || { display: "block" }}
            data-ad-client={pubId}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
        />
    );
}
