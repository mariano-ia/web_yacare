import { NextResponse, type NextRequest } from "next/server";

// ─── Dashboard auth ──────────────────────────────────────────

const PUBLIC_PATHS = [
    "/dashboard/login",
    "/dashboard/forgot-password",
    "/dashboard/reset-password",
];

function isTokenValid(token: string): boolean {
    try {
        const [, payload] = token.split(".");
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
        return typeof decoded.exp === "number" && decoded.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

// ─── i18n redirects ──────────────────────────────────────────

/** Paths that should NOT be redirected to /es/... */
const BYPASS_PREFIXES = ["/api/", "/dashboard", "/es", "/en", "/_next", "/sitemap", "/news-sitemap", "/robots", "/favicon"];
const BYPASS_EXTENSIONS = [".xml", ".txt", ".ico", ".svg", ".png", ".jpg", ".html"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ─── Dashboard auth guard ────────────────────────────────
    if (pathname.startsWith("/dashboard")) {
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

    // ─── i18n: redirect old URLs to /es/... ──────────────────
    // Skip bypass paths
    if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }
    if (BYPASS_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
        return NextResponse.next();
    }

    // "/" → "/es"
    if (pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/es";
        return NextResponse.redirect(url, 301);
    }

    // "/categoria/slug" → "/es/categoria/slug"
    // "/autor/slug" → "/es/autor/slug"
    // "/any-article-slug" → "/es/any-article-slug"
    const url = request.nextUrl.clone();
    url.pathname = `/es${pathname}`;
    return NextResponse.redirect(url, 301);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image).*)",
    ],
};
