import { NextResponse, type NextRequest } from "next/server";

// Dashboard sub-paths that don't require authentication
const PUBLIC_PATHS = [
    "/dashboard/login",
    "/dashboard/forgot-password",
    "/dashboard/reset-password",
];

/** Decode JWT payload and check expiry — no signature verification needed
 *  since the cookie is HTTP-only (not accessible via JS) */
function isTokenValid(token: string): boolean {
    try {
        const [, payload] = token.split(".");
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
        return typeof decoded.exp === "number" && decoded.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only intercept /dashboard routes
    if (!pathname.startsWith("/dashboard")) {
        return NextResponse.next();
    }

    // Allow auth pages through
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const token = request.cookies.get("ds")?.value;

    if (!token || !isTokenValid(token)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/dashboard/login";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
