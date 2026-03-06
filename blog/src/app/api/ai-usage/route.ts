import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const API_SECRET = process.env.API_SECRET || "changeme";

// POST: Called by N8N after each AI model invocation
export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${API_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { workflow, model, type, tokens_in, tokens_out, cost_usd, article_slug } = body;

        if (!workflow || !model || !type) {
            return NextResponse.json({ error: "workflow, model, type required" }, { status: 400 });
        }

        const sb = getServiceClient();
        const { error } = await sb.from("ai_usage_logs").insert({
            workflow,
            model,
            type,
            tokens_in: tokens_in ?? 0,
            tokens_out: tokens_out ?? 0,
            cost_usd: cost_usd ?? 0,
            article_slug: article_slug ?? null,
        });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
