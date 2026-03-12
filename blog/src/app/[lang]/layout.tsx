import { notFound } from "next/navigation";
import { I18nProvider } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const VALID_LANGS: Lang[] = ["es", "en"];

export default async function LangLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;

    if (!VALID_LANGS.includes(lang as Lang)) {
        notFound();
    }

    return (
        <I18nProvider initialLang={lang as Lang}>
            {children}
        </I18nProvider>
    );
}
