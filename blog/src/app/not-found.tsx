"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";

export default function NotFound() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="ep-page">
        <Nav />
        <div style={{ minHeight: '85vh', backgroundColor: 'var(--ep-bg)' }} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="ep-page">
      <Nav />
      <div className="ep-main" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '85vh', 
        textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(138, 94, 255, 0.15) 0%, rgba(0,0,0,0) 70%)'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
          <h1 style={{ 
            fontSize: 'clamp(8rem, 25vw, 15rem)', 
            lineHeight: '0.8', 
            marginBottom: 'var(--space-4)',
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.4) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            404
          </h1>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'clamp(2rem, 6vw, 4rem)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            marginBottom: 'var(--space-6)',
            color: 'var(--text-primary)'
          }}>
            {t("pages.not_found.title")}
          </h2>
          <p style={{ 
            fontSize: '1.15rem', 
            color: 'rgba(255, 255, 255, 0.7)', 
            margin: '0 auto var(--space-8)', 
            maxWidth: '500px', 
            lineHeight: '1.6' 
          }}>
            {t("pages.not_found.subtitle")}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link href="/" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              color: '#000',
              padding: '0 28px',
              height: '52px',
              borderRadius: '999px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'transform 0.2s ease, opacity 0.2s ease',
              fontSize: '1rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              {t("pages.not_found.btn")}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
