import { ImageResponse } from 'next/og';

export const alt = 'Tenant Pulse Legal Risk Analysis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { keyword: string } }) {
  let displayWord = decodeURIComponent(params.keyword).replace(/-/g, ' ');
  displayWord = displayWord.charAt(0).toUpperCase() + displayWord.slice(1);

  try {
    // Webpack statically analyzes this and bundles the entire clauses folder
    const seoData = await import(`../../../content/clauses/${params.keyword.toLowerCase()}.json`);
    if (seoData && seoData.default && seoData.default.clause) {
      displayWord = seoData.default.clause;
    } else if (seoData && seoData.clause) {
      displayWord = seoData.clause;
    }
  } catch (e) {
    console.error("Error reading SEO JSON for OG image:", e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #004D40 0%, #001c17 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -150,
            width: 600,
            height: 600,
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '50%',
            filter: 'blur(80px)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginLeft: '16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Tenant Pulse
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '50px 80px',
            borderRadius: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
            marginBottom: '40px',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, padding: 0, paddingBottom: '20px' }}>
            AI Legal Risk Scanner
          </div>
          <h1 style={{ fontSize: '64px', fontWeight: 900, color: 'white', lineHeight: 1.1, margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            Predatory <span style={{ color: '#10B981', marginLeft: '16px', marginRight: '16px' }}>{displayWord}</span> Clauses Exposed
          </h1>
        </div>

        {/* Fake CTA Button to indicate scanner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFFFFF',
            padding: '24px 48px',
            borderRadius: '24px',
            color: '#004D40',
            fontSize: '32px',
            fontWeight: 900,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '4px solid #10B981'
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
          </svg>
          Scan Your Lease
        </div>

      </div>
    ),
    { ...size }
  );
}
