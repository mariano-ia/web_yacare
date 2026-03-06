"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
    {
        section: "Panel",
        items: [
            {
                href: "/dashboard",
                label: "Resumen",
                icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                ),
            },
        ],
    },
    {
        section: "Contenido",
        items: [
            {
                href: "/dashboard/posts",
                label: "Posts",
                icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                ),
            },
            {
                href: "/dashboard/posts/new",
                label: "Crear post",
                icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                ),
            },
            {
                href: "/dashboard/subscribers",
                label: "Suscriptores",
                icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                ),
            },
        ],
    },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [dark, setDark] = useState(true);

    // Init theme from localStorage or system
    useEffect(() => {
        const saved = localStorage.getItem("dash-theme");
        if (saved) {
            setDark(saved === "dark");
        } else {
            setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
    }, []);

    // Apply theme to html element
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        localStorage.setItem("dash-theme", dark ? "dark" : "light");
    }, [dark]);

    // Exact match for dashboard root, prefix match for sub-pages
    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <div className="dash-root">
            {/* Sidebar */}
            <aside className="dash-sidebar">
                <div className="dash-sidebar__brand">
                    <Link href="/dashboard" className="dash-sidebar__logo">El Pantano</Link>
                    <div className="dash-sidebar__subtitle">Dashboard</div>
                </div>

                <nav className="dash-sidebar__nav">
                    {NAV.map((group) => (
                        <div key={group.section}>
                            <div className="dash-nav-section">{group.section}</div>
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`dash-nav-link ${isActive(item.href) ? "dash-nav-link--active" : ""}`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="dash-sidebar__footer">
                    <Link href="/" className="dash-sidebar__blog-link" target="_blank">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        <span>Ver blog</span>
                    </Link>
                    <button
                        className={`dash-theme-toggle ${dark ? "dash-theme-toggle--dark" : ""}`}
                        onClick={() => setDark((d) => !d)}
                        aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                        title={dark ? "Modo claro" : "Modo oscuro"}
                    />
                </div>
            </aside>

            {/* Main content */}
            <main className="dash-main">{children}</main>
        </div>
    );
}
