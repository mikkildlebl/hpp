import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05070c',
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(29,78,216,0.55), transparent 60%)',
        }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
            color: '#fff',
            fontSize: 44,
            fontWeight: 700,
            marginBottom: 32,
          }}>
          HP
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 700, color: '#fff', letterSpacing: -1 }}>
          <div style={{ display: 'flex', fontSize: 56 }}>Maxa ditt</div>
          <div style={{ display: 'flex', fontSize: 56 }}>högskoleprovsresultat</div>
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 28, color: 'rgba(255,255,255,0.6)' }}>
          Riktiga provfrågor. Direkt facit. Ditt tempo.
        </div>
      </div>
    ),
    { ...size }
  );
}
