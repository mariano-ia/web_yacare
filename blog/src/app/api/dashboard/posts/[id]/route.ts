import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

// PATCH: update article fields (hero toggle, featured, status, or full edit)
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();
        const sb = getServiceClient();

        // If setting as hero, clear previous hero first
        if (body.is_hero === true) {
            await sb.from("articles").update({ is_hero: false }).eq("is_hero", true);
        }

        const { data, error } = await sb
            .from("articles")
            .update(body)
            .eq("id", id)
            .select("slug, category:categories(slug)")
            .single();

        if (error) throw error;

        revalidatePath("/");
        if (data?.slug) revalidatePath(`/${data.slug}`);

        return NextResponse.json({ success: true, data });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// DELETE: remove article
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const sb = getServiceClient();

        const { data: article } = await sb
            .from("articles")
            .select("slug, category:categories(slug)")
            .eq("id", id)
            .single();

        const { error } = await sb.from("articles").delete().eq("id", id);
        if (error) throw error;

        revalidatePath("/");
        if (article?.slug) revalidatePath(`/${article.slug}`);

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
