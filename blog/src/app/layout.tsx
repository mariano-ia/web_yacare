import type { Metadata } from "next";
import "./globals.css";
import "./elpantano.css";

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
    <html lang="es">
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
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Antonio:wght@100..700&family=Figtree:ital,wght@0,300..900;1,300..900&family=IBM+Plex+Serif:ital,wght@0,500;1,500&display=swap"
          rel="stylesheet"
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
