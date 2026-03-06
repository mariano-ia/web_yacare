import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const format = url.searchParams.get("format");

        const sb = getServiceClient();
        const { data, error } = await sb
            .from("newsletter_subscribers")
            .select("email, subscribed_at, active")
            .order("subscribed_at", { ascending: false });

        if (error) throw error;

        // CSV download
        if (format === "csv") {
            const rows = (data ?? []) as { email: string; subscribed_at: string; active: boolean }[];
            const csv = [
                "email,subscribed_at,active",
                ...rows.map((r) => `${r.email},${r.subscribed_at},${r.active}`),
            ].join("\n");

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
                },
            });
        }

        return NextResponse.json({ success: true, data, total: data?.length ?? 0 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
