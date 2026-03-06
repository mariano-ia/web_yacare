import type { Metadata } from "next";
import { Antonio, Figtree, IBM_Plex_Serif } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://yacare.io/elpantano"
  ),
  title: {
    default: "El Pantano — Tecnología, Cultura y Opinión",
    template: "%s — El Pantano",
  },
  description:
    "El Pantano es una publicación digital de múltiples voces. Tecnología, cultura, IA, análisis y opinión sin filtro.",
  openGraph: {
    type: "website",
    locale: "es_AR",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${antonio.variable} ${figtree.variable} ${ibmPlexSerif.variable}`}>
      <head>
        <meta name="color-scheme" content="dark" />
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
      <body className="ep-page">{children}</body>
    </html>
  );
}
