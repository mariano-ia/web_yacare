import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
        return NextResponse.json({ results: [] });
    }

    if (!supabase) {
        return NextResponse.json({ results: [] });
    }

    // Use Supabase full-text search with ilike fallback
    const searchTerm = `%${q}%`;

    const { data, error } = await supabase
        .from("articles")
        .select(`
            id,
            title,
            slug,
            excerpt,
            featured_image,
            published_at,
            reading_time,
            category:categories(name, slug, color),
            author:authors(name, avatar_initial)
        `)
        .eq("status", "published")
        .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .order("published_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("[search] Error:", error);
        return NextResponse.json({ results: [] });
    }

    return NextResponse.json({ results: data ?? [] });
}
