import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { name, email, company, budget, message } = await req.json();

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email" },
                { status: 400 }
            );
        }

        // Save to Supabase
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: dbError } = await sb.from("contacts").insert({
            name,
            email,
            company: company || null,
            budget: budget || null,
            message,
        });

        if (dbError) {
            console.error("[contact] DB error:", dbError);
            return NextResponse.json(
                { success: false, error: "Error saving contact" },
                { status: 500 }
            );
        }

        // Send email notification via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            try {
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${resendKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: "Yacaré Web <noreply@updates.yacare.io>",
                        to: ["mariano@yacare.io"],
                        subject: `Nuevo contacto: ${name}`,
                        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
<h2 style="margin:0 0 16px">Nuevo contacto desde yacare.io</h2>
<table style="width:100%;border-collapse:collapse">
<tr><td style="padding:8px 0;color:#666;width:100px">Nombre</td><td style="padding:8px 0"><strong>${name}</strong></td></tr>
<tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
${company ? `<tr><td style="padding:8px 0;color:#666">Empresa</td><td style="padding:8px 0">${company}</td></tr>` : ""}
${budget ? `<tr><td style="padding:8px 0;color:#666">Budget</td><td style="padding:8px 0">${budget}</td></tr>` : ""}
</table>
<div style="margin:16px 0;padding:16px;background:#f5f5f5;border-radius:8px">
<p style="margin:0;color:#666;font-size:12px;margin-bottom:8px">Mensaje</p>
<p style="margin:0;white-space:pre-wrap">${message}</p>
</div>
</div>`,
                    }),
                });
            } catch (emailErr) {
                console.error("[contact] Resend error:", emailErr);
                // Don't fail the request — contact is already saved
            }
        } else {
            console.warn("[contact] RESEND_API_KEY not set — skipping email notification");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[contact] Error:", err);
        return NextResponse.json(
            { success: false, error: "Internal error" },
            { status: 500 }
        );
    }
}
