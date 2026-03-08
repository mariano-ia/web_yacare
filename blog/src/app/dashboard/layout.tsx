import type { Metadata } from "next";
import { DashboardLayoutClient } from "./DashboardLayoutClient";
import "./dashboard.css";

export const metadata: Metadata = {
    title: "Dashboard — El Pantano",
    robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
