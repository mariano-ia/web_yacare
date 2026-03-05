import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// ─── POST: Increment view count for an article ──────
export async function POST(req: NextRequest) {
    try {
        const { slug } = await req.json();
        if (!slug || typeof slug !== "string") {
            return NextResponse.json({ error: "slug required" }, { status: 400 });
        }

        const sb = getServiceClient();

        // Try RPC first (atomic increment)
        const { error: rpcError } = await sb.rpc("increment_view_count", {
            article_slug: slug,
        });

        if (rpcError) {
            // Fallback: manual increment if RPC function not yet created
            const { data: article } = await sb
                .from("articles")
                .select("view_count")
                .eq("slug", slug)
                .single();

            if (article) {
                await sb
                    .from("articles")
                    .update({ view_count: (article.view_count || 0) + 1 })
                    .eq("slug", slug);
            }
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

