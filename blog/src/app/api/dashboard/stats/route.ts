import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
    try {
        const sb = getServiceClient();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [articlesRes, monthArticlesRes, subscribersRes, usageAllRes, usageMonthRes, usageWeekRes] =
            await Promise.all([
                // Total articles
                sb.from("articles").select("id", { count: "exact", head: true }),
                // This month's articles
                sb.from("articles").select("id", { count: "exact", head: true })
                    .gte("published_at", startOfMonth),
                // Newsletter subscribers
                sb.from("newsletter_subscribers").select("id", { count: "exact", head: true })
                    .eq("active", true),
                // All-time token costs
                sb.from("ai_usage_logs").select("type, cost_usd"),
                // This month's costs
                sb.from("ai_usage_logs").select("type, cost_usd")
                    .gte("created_at", startOfMonth),
                // This week's costs
                sb.from("ai_usage_logs").select("type, cost_usd")
                    .gte("created_at", startOfWeek),
            ]);

        function sumCosts(rows: { type: string; cost_usd: number }[] | null) {
            const r = rows ?? [];
            return {
                total: r.reduce((acc, x) => acc + Number(x.cost_usd), 0),
                posts: r.filter((x) => x.type === "post").reduce((acc, x) => acc + Number(x.cost_usd), 0),
                images: r.filter((x) => x.type === "image").reduce((acc, x) => acc + Number(x.cost_usd), 0),
            };
        }

        return NextResponse.json({
            articles: {
                total: articlesRes.count ?? 0,
                this_month: monthArticlesRes.count ?? 0,
            },
            subscribers: subscribersRes.count ?? 0,
            costs: {
                all_time: sumCosts(usageAllRes.data),
                this_month: sumCosts(usageMonthRes.data),
                this_week: sumCosts(usageWeekRes.data),
            },
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
