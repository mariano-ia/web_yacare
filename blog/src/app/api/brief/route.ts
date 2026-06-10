import { NextRequest, NextResponse } from "next/server";

type Answer = { question: string; hint?: string; answer: string };
type Section = { title: string; answers: Answer[] };
type Payload = {
    brief_slug: string;
    client_name?: string;
    project: string;
    respondent: { name: string; email: string; role?: string };
    sections: Section[];
};

const EMAIL_FROM = "Yacaré Briefs <noreply@yacare.io>";
const INTERNAL_RECIPIENTS = ["mariano@yacare.io", "martin@yacare.io"];

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderInternalHtml(p: Payload): string {
    const title = p.client_name
        ? `Nuevo brief: ${p.client_name}`
        : "Nuevo brief recibido";

    const meta = `
<table style="width:100%;border-collapse:collapse;margin:16px 0">
  <tr><td style="padding:6px 0;color:#666;width:140px">Cliente</td><td style="padding:6px 0"><strong>${escapeHtml(p.client_name || "—")}</strong></td></tr>
  <tr><td style="padding:6px 0;color:#666">Proyecto</td><td style="padding:6px 0">${escapeHtml(p.project)}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Nombre</td><td style="padding:6px 0">${escapeHtml(p.respondent.name)}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(p.respondent.email)}">${escapeHtml(p.respondent.email)}</a></td></tr>
  ${p.respondent.role ? `<tr><td style="padding:6px 0;color:#666">Rol</td><td style="padding:6px 0">${escapeHtml(p.respondent.role)}</td></tr>` : ""}
  <tr><td style="padding:6px 0;color:#666">Slug</td><td style="padding:6px 0"><code>${escapeHtml(p.brief_slug)}</code></td></tr>
</table>`;

    const sectionsHtml = p.sections
        .map((section) => {
            const items = section.answers
                .filter((a) => a.answer && a.answer.trim().length > 0)
                .map(
                    (a) => `
<div style="margin:0 0 20px 0">
  <div style="font-weight:600;color:#111;margin:0 0 4px 0">${escapeHtml(a.question)}</div>
  ${a.hint ? `<div style="color:#888;font-size:13px;margin:0 0 8px 0;font-style:italic">${escapeHtml(a.hint)}</div>` : ""}
  <div style="white-space:pre-wrap;color:#222;line-height:1.5">${escapeHtml(a.answer)}</div>
</div>`
                )
                .join("");

            if (!items) return "";

            return `
<div style="margin:24px 0;padding:20px;background:#fafafa;border-radius:8px;border:1px solid #eee">
  <h3 style="margin:0 0 16px 0;font-size:16px;color:#000;text-transform:uppercase;letter-spacing:0.05em">${escapeHtml(section.title)}</h3>
  ${items}
</div>`;
        })
        .join("");

    return `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:640px;margin:0 auto;color:#222">
<h2 style="margin:0 0 8px">${escapeHtml(title)}</h2>
<p style="margin:0;color:#666">Brief recibido desde yacare.io</p>
${meta}
${sectionsHtml || '<p style="color:#888">No se respondió ninguna pregunta opcional.</p>'}
</div>`;
}

async function sendEmail(
    resendKey: string,
    to: string[],
    subject: string,
    html: string,
    replyTo?: string
) {
    const body: Record<string, unknown> = {
        from: EMAIL_FROM,
        to,
        subject,
        html,
    };
    if (replyTo) body.reply_to = replyTo;

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Resend ${res.status}: ${text}`);
    }
}

export async function POST(req: NextRequest) {
    try {
        const payload = (await req.json()) as Payload;

        if (
            !payload.brief_slug ||
            !payload.project ||
            !payload.respondent?.name ||
            !payload.respondent?.email ||
            !Array.isArray(payload.sections)
        ) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.respondent.email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email" },
                { status: 400 }
            );
        }

        // Email-only delivery. Yacaré does not store briefs anywhere (no
        // Supabase). The brief is sent solely as one internal email to the team
        // (Mariano + Martín) via Resend. The respondent gets NO confirmation
        // email: their only acknowledgement is the on-screen success screen.
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) {
            console.error("[brief] RESEND_API_KEY not set, cannot deliver brief");
            return NextResponse.json(
                { success: false, error: "Email not configured" },
                { status: 500 }
            );
        }

        const internalSubject = payload.client_name
            ? `Nuevo brief: ${payload.client_name} (${payload.respondent.name})`
            : `Nuevo brief de ${payload.respondent.name}`;

        // Email is the only delivery channel (no DB fallback), so a failure must
        // surface as a non-200. The form retries on a non-ok response instead of
        // silently losing the brief.
        await sendEmail(
            resendKey,
            INTERNAL_RECIPIENTS,
            internalSubject,
            renderInternalHtml(payload),
            payload.respondent.email
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[brief] Error:", err);
        return NextResponse.json(
            { success: false, error: "Internal error" },
            { status: 500 }
        );
    }
}
