import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET all articles for dashboard (all statuses, with category/author)
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "100");

        const sb = getServiceClient();
        const { data, error } = await sb
            .from("articles")
            .select("id, title, slug, status, published_at, is_hero, is_featured, view_count, category:categories(name,slug,color), author:authors(name)")
            .order("published_at", { ascending: false })
            .limit(limit);

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
