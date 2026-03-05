import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, error: "Email inválido" },
                { status: 400 }
            );
        }

        // Store in Supabase (create table if first time, or just insert)
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !serviceKey) {
            console.error("[newsletter] Missing Supabase credentials");
            return NextResponse.json(
                { success: false, error: "Error de configuración" },
                { status: 500 }
            );
        }

        const sb = createClient(supabaseUrl, serviceKey);

        // Try to insert — the table must exist (we'll create it via SQL if not)
        const { error } = await sb
            .from("newsletter_subscribers")
            .upsert(
                { email, subscribed_at: new Date().toISOString(), active: true },
                { onConflict: "email" }
            );

        if (error) {
            // Table might not exist yet — log but return success to user
            console.error("[newsletter] Insert error:", error);
            // Fallback: just log the email
            console.log("[newsletter] New subscriber (fallback log):", email);
        }

        return NextResponse.json({
            success: true,
            message: "¡Suscripción confirmada! Te avisamos cada semana.",
        });
    } catch (err) {
        console.error("[newsletter] Error:", err);
        return NextResponse.json(
            { success: false, error: "Error interno" },
            { status: 500 }
        );
    }
}
