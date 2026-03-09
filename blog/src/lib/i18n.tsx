"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { defaultTranslations } from "./translations";

type Lang = "en" | "es";

type TranslationsContextType = {
    lang: Lang;
    t: (key: string) => string;
    setLang: (lang: Lang) => void;
};

const I18nContext = createContext<TranslationsContextType>({
    lang: "es",
    t: (key) => key,
    setLang: () => { },
});

export const I18nProvider = ({
    children,
    initialLang = "es"
}: {
    children: React.ReactNode;
    initialLang?: Lang;
}) => {
    const [lang, setLangState] = useState<Lang>(initialLang);

    const setLang = (newLang: Lang) => {
        setLangState(newLang);
        localStorage.setItem("yacare_lang", newLang);
        document.cookie = `yacare_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = newLang;
        // Dispatch event to sync with other components if necessary
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: newLang } }));
        }
    };

    useEffect(() => {
        // Try to sync with main site's LocalStorage if client-side rendering
        // But we already have initialLang from server's cookie.
        // If we want to strictly enforce client-side sync, we check it:
        const saved = localStorage.getItem("yacare_lang") as Lang | null;
        if (saved && ["en", "es"].includes(saved) && saved !== lang) {
            setLangState(saved);
            document.documentElement.lang = saved;
        } else if (!saved) {
            // First time user on subdomain, let's detect browser language
            const browserLang = navigator.language.split("-")[0].toLowerCase() as Lang;
            if (["en", "es"].includes(browserLang) && browserLang !== lang) {
                setLang(browserLang);
            }
        }

        // Listen to changes from other tabs or the main site (if same origin)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === "yacare_lang" && e.newValue && ["en", "es"].includes(e.newValue)) {
                setLangState(e.newValue as Lang);
                document.documentElement.lang = e.newValue;
                document.cookie = `yacare_lang=${e.newValue}; path=/; max-age=31536000; SameSite=Lax`;
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [lang]);

    const t = (key: string) => {
        const keys = key.split(".");
        let value: any = defaultTranslations[lang];
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return key;
            }
        }
        return typeof value === "string" ? value : key;
    };

    return (
        <I18nContext.Provider value={{ lang, setLang, t }
        }>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => useContext(I18nContext);
