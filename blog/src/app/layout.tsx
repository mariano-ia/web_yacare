import type { Metadata } from "next";
import { Antonio, Figtree, IBM_Plex_Serif } from "next/font/google";
import { cookies, headers } from "next/headers";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";
import "./elpantano.css";

const antonio = Antonio({
  subsets: ["latin"],
  variable: "--font-antonio",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  style: ["normal", "italic"],
  display: "swap",
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  weight: ["500"],
  style: ["normal", "italic"],
  display: "swap",
});

import { getServerTranslation, getServerLang } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslation();
  const lang = await getServerLang();

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano"
    ),
    title: {
      default: t("meta.title"),
      template: "%s — El Pantano",
    },
    description: t("meta.description"),
    openGraph: {
      type: "website",
      locale: lang === "es" ? "es_AR" : "en_US",
      siteName: "El Pantano",
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: "/favicon.svg",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Check cookie
  const cookieStore = await cookies();
  let lang = cookieStore.get("yacare_lang")?.value;

  // 2. Check Accept-Language
  if (!lang || !["en", "es"].includes(lang)) {
    const headersList = await headers();
    const acceptLang = headersList.get("accept-language");
    if (acceptLang?.toLowerCase().includes("es")) {
      lang = "es";
    } else {
      lang = "en";
    }
  }

  return (
    <html lang={lang as string} className={`${antonio.variable} ${figtree.variable} ${ibmPlexSerif.variable}`}>
      <head>
        <meta name="color-scheme" content="dark" />
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://ajqjicwuqbxpgkrrnryn.supabase.co" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-TKZE3QCB9L"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-TKZE3QCB9L');
            `,
          }}
        />
        {/* Google AdSense — set NEXT_PUBLIC_ADSENSE_ID env var to activate */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="ep-page">
        <I18nProvider initialLang={lang as "es" | "en"}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
