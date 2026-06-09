// Vercel serverless function — contact form. Email-only via Resend (no DB).
// Replaces the old /blog/api/contact endpoint from the retired Next.js app.

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        let body = req.body;
        if (typeof body === "string") {
            try { body = JSON.parse(body); } catch { body = {}; }
        }
        body = body || {};
        const { name, email, company, budget, message } = body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, error: "Invalid email" });
        }

        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) {
            console.error("[contact] RESEND_API_KEY not set — cannot deliver contact");
            return res.status(500).json({ success: false, error: "Email not configured" });
        }

        const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Yacaré Web <noreply@yacare.io>",
                to: ["mariano@yacare.io"],
                reply_to: email,
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

        if (!resp.ok) {
            const text = await resp.text();
            console.error("[contact] Resend error:", resp.status, text);
            return res.status(500).json({ success: false, error: "Error sending message" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[contact] Error:", err);
        return res.status(500).json({ success: false, error: "Internal error" });
    }
}
