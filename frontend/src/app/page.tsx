import Link from 'next/link';

/**
 * Sameem Hub — root landing (v1.7.1).
 *
 * Phase 2 multi-tenant SaaS is in active development; this landing page
 * is the public entry point until the modules ship. The frozen v1.7
 * dashboard remains fully available at /classic.
 */
export default function RootPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '48px',
        background: 'linear-gradient(135deg,#0b1f3a 0%,#0a1428 100%)',
        color: '#e6e9ef',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Tajawal, sans-serif',
      }}
    >
      <div style={{ maxWidth: 720, textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, margin: 0, color: '#d4af37', letterSpacing: '-0.02em' }}>
          Sameem Hub
        </h1>
        <p style={{ fontSize: 18, marginTop: 12, color: '#9ca3af' }}>
          Saudi Furniture Marketplace Operating System &mdash; v1.7
        </p>
        <p style={{ marginTop: 32, lineHeight: 1.7 }}>
          The full multi-tenant SaaS is in active development.
          The frozen v1.7 dashboard (24 modules, bilingual EN/AR, RTL-ready, ZATCA &amp; PDPL compliant)
          is fully available below.
        </p>

        <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/classic"
            style={{
              padding: '14px 28px',
              background: '#d4af37',
              color: '#0b1f3a',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 16,
            }}
          >
            Open v1.7 Dashboard &rarr;
          </Link>
          <a
            href="https://github.com/abdullahrajeh21-cloud/sameem-hub"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '14px 28px',
              background: 'transparent',
              color: '#e6e9ef',
              border: '1px solid #2a3a5a',
              borderRadius: 8,
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: 16,
            }}
          >
            View source on GitHub
          </a>
        </div>

        <p style={{ marginTop: 48, fontSize: 13, color: '#6b7280' }}>
          Designed by Abdullah Aldossari &middot; Built on Next.js 14 &middot; Deployed on Netlify
        </p>
      </div>
    </main>
  );
}
