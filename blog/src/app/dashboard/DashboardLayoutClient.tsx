"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DashboardShell } from "./DashboardShell";

const AUTH_PATHS = [
    "/dashboard/login",
    "/dashboard/forgot-password",
    "/dashboard/reset-password",
];

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

    // Apply saved theme on auth pages too (DashboardShell handles it otherwise)
    useEffect(() => {
        if (!isAuth) return;
        const saved = localStorage.getItem("dash-theme");
        const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    }, [isAuth]);

    if (isAuth) {
        // Auth pages: themed background, no sidebar
        return <div className="dash-root" style={{ display: "block" }}>{children}</div>;
    }

    return <DashboardShell>{children}</DashboardShell>;
}
