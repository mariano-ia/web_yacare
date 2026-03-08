import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const COOKIE = "ds";
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
    const { action, email, password } = await req.json();

    // ── Logout ──────────────────────────────────────────────────────
    if (action === "logout") {
        const res = NextResponse.json({ success: true });
        res.cookies.set(COOKIE, "", {
            httpOnly: true,
            secure: IS_PROD,
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });
        return res;
    }

    // ── Login ───────────────────────────────────────────────────────
    const supaRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await supaRes.json();

    if (!supaRes.ok || !data.access_token) {
        return NextResponse.json(
            { error: "Email o contraseña incorrectos." },
            { status: 401 }
        );
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE, data.access_token, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: "lax",
        path: "/",
        maxAge: data.expires_in ?? 3600,
    });
    return res;
}
