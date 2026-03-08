import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// These dashboard sub-paths are publicly accessible (no login required)
const PUBLIC_PATHS = [
    "/dashboard/login",
    "/dashboard/forgot-password",
    "/dashboard/reset-password",
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only intercept /dashboard routes
    if (!pathname.startsWith("/dashboard")) {
        return NextResponse.next();
    }

    // Pass through auth pages without checking session
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired — important for SSR
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/dashboard/login";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
