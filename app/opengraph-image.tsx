import { ImageResponse } from '@vercel/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'Winson Chen – Creative';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const fontData = readFileSync(join(process.cwd(), 'public/soria-font.ttf'));

  // Generate ~120 stars deterministically
  const stars = Array.from({ length: 120 }, (_, i) => {
    const x = ((i * 97 + 13) % 1200);
    const y = ((i * 61 + 7) % 630);
    const size = (i % 3) === 0 ? 2 : 1;
    const opacity = 0.3 + (i % 5) * 0.14;
    return { x, y, size, opacity };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'radial-gradient(ellipse at 50% 60%, #1a1a1a 0%, #0a0a0a 60%, #050505 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Soria',
        }}
      >
        {/* Stars */}
        {stars.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}px`,
              top: `${s.y}px`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              borderRadius: '50%',
              background: `rgba(255,255,255,${s.opacity})`,
            }}
          />
        ))}

        {/* Cloud glow at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '500px',
            height: '300px',
            background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.18) 0%, rgba(200,200,200,0.08) 40%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(18px)',
          }}
        />

        {/* Text */}
        <span
          style={{
            color: 'white',
            fontSize: '72px',
            letterSpacing: '0.02em',
            fontFamily: 'Soria',
            position: 'relative',
            zIndex: 1,
            marginBottom: '60px',
          }}
        >
          Hi, I am Winson Chen.
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Soria', data: fontData, style: 'normal' }],
    }
  );
}
