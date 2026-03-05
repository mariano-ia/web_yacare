import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/supabase";
import type { CreateArticlePayload, ApiResponse } from "@/lib/types";

const API_SECRET = process.env.API_SECRET || "changeme";

function authorize(req: NextRequest): boolean {
    const auth = req.headers.get("authorization");
    return auth === `Bearer ${API_SECRET}`;
}

// ─── POST: Create article (for n8n) ──────────────────────
export async function POST(req: NextRequest) {
    if (!authorize(req)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body: CreateArticlePayload = await req.json();
        const sb = getServiceClient();

        // Resolve category
        const { data: cat } = await sb
            .from("categories")
            .select("id")
            .eq("slug", body.category)
            .single();

        if (!cat) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: `Category "${body.category}" not found` },
                { status: 400 }
            );
        }

        // Resolve author
        const { data: author } = await sb
            .from("authors")
            .select("id")
            .eq("slug", body.author)
            .single();

        if (!author) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: `Author "${body.author}" not found` },
                { status: 400 }
            );
        }

        // Insert article
        const { data: article, error } = await sb
            .from("articles")
            .insert({
                title: body.title,
                slug: body.slug,
                excerpt: body.excerpt || "",
                content: body.content || "",
                featured_image: body.featured_image || "",
                image_alt: body.image_alt || "",
                category_id: cat.id,
                author_id: author.id,
                reading_time: body.reading_time || 5,
                keywords: body.keywords || [],
                is_featured: body.is_featured || false,
                is_hero: body.is_hero || false,
                status: body.status || "published",
                published_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // ─── Revalidate ISR pages ───
        revalidatePath("/");
        revalidatePath(`/${body.slug}`);
        revalidatePath(`/categoria/${body.category}`);

        return NextResponse.json<ApiResponse>(
            { success: true, data: article },
            { status: 201 }
        );
    } catch (err) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: (err as Error).message },
            { status: 500 }
        );
    }
}

// ─── GET: List articles ──────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const status = url.searchParams.get("status") || "published";

        const sb = getServiceClient();
        const { data, error } = await sb
            .from("articles")
            .select("*, category:categories(*), author:authors(*)")
            .eq("status", status)
            .order("published_at", { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json<ApiResponse>({ success: true, data });
    } catch (err) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: (err as Error).message },
            { status: 500 }
        );
    }
}
