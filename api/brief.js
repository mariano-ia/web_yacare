// Vercel serverless function — client briefs. Email-only via Resend (no DB).
// Replaces the old /blog/api/brief endpoint from the retired Next.js app.

const EMAIL_FROM = "Yacaré Briefs <noreply@yacare.io>";
const INTERNAL_RECIPIENTS = ["mariano@yacare.io", "martin@yacare.io"];

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderInternalHtml(p) {
    const title = p.client_name ? `Nuevo brief: ${p.client_name}` : "Nuevo brief recibido";

    const meta = `
<table style="width:100%;border-collapse:collapse;margin:16px 0">
  <tr><td style="padding:6px 0;color:#666;width:140px">Cliente</td><td style="padding:6px 0"><strong>${escapeHtml(p.client_name || "—")}</strong></td></tr>
  <tr><td style="padding:6px 0;color:#666">Proyecto</td><td style="padding:6px 0">${escapeHtml(p.project)}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Nombre</td><td style="padding:6px 0">${escapeHtml(p.respondent.name)}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(p.respondent.email)}">${escapeHtml(p.respondent.email)}</a></td></tr>
  ${p.respondent.role ? `<tr><td style="padding:6px 0;color:#666">Rol</td><td style="padding:6px 0">${escapeHtml(p.respondent.role)}</td></tr>` : ""}
  <tr><td style="padding:6px 0;color:#666">Slug</td><td style="padding:6px 0"><code>${escapeHtml(p.brief_slug)}</code></td></tr>
</table>`;

    const sectionsHtml = (p.sections || [])
        .map((section) => {
            const items = (section.answers || [])
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

function renderConfirmationHtml(p) {
    const firstName = p.respondent.name.split(" ")[0] || p.respondent.name;
    return `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;color:#222;line-height:1.6">
<h2 style="margin:0 0 16px;color:#000">Recibimos tu brief</h2>
<p style="margin:0 0 16px">Hola ${escapeHtml(firstName)}, gracias por tomarte el tiempo de completar el brief de <strong>${escapeHtml(p.project)}</strong>.</p>
<p style="margin:0 0 16px">Ya lo estamos revisando con el equipo. Te escribimos en las próximas 24 a 48 horas con los siguientes pasos.</p>
<p style="margin:0 0 24px">Mientras tanto, si surge algo urgente, escribinos a <a href="mailto:contact@yacare.io" style="color:#000">contact@yacare.io</a>.</p>
<div style="margin:24px 0 0;padding:16px 0;border-top:1px solid #eee;color:#888;font-size:13px">
  Yacaré<br>
  <a href="https://yacare.io" style="color:#888">yacare.io</a>
</div>
</div>`;
}

async function sendEmail(resendKey, to, subject, html, replyTo) {
    const body = { from: EMAIL_FROM, to, subject, html };
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

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        let payload = req.body;
        if (typeof payload === "string") {
            try { payload = JSON.parse(payload); } catch { payload = {}; }
        }
        payload = payload || {};

        if (
            !payload.brief_slug ||
            !payload.project ||
            !payload.respondent ||
            !payload.respondent.name ||
            !payload.respondent.email ||
            !Array.isArray(payload.sections)
        ) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.respondent.email)) {
            return res.status(400).json({ success: false, error: "Invalid email" });
        }

        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) {
            console.error("[brief] RESEND_API_KEY not set — cannot deliver brief");
            return res.status(500).json({ success: false, error: "Email not configured" });
        }

        const internalSubject = payload.client_name
            ? `Nuevo brief: ${payload.client_name} (${payload.respondent.name})`
            : `Nuevo brief de ${payload.respondent.name}`;
        const confirmationSubject = `Recibimos tu brief de ${payload.project}`;

        const results = await Promise.allSettled([
            sendEmail(resendKey, INTERNAL_RECIPIENTS, internalSubject, renderInternalHtml(payload), payload.respondent.email),
            sendEmail(resendKey, [payload.respondent.email], confirmationSubject, renderConfirmationHtml(payload)),
        ]);

        // The internal notification is the one that must land.
        if (results[0].status === "rejected") {
            console.error("[brief] internal email failed:", results[0].reason);
            return res.status(500).json({ success: false, error: "Error sending brief" });
        }
        if (results[1].status === "rejected") {
            console.error("[brief] confirmation email failed:", results[1].reason);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[brief] Error:", err);
        return res.status(500).json({ success: false, error: "Internal error" });
    }
}
