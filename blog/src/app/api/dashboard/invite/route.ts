import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.yacare.io/blog";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 });
        }

        const sb = getServiceClient();
        const { error } = await sb.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${SITE_URL}/dashboard/reset-password`,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
