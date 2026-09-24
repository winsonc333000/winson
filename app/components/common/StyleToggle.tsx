'use client';

import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import { SiteStyle, useStyleStore, useThemeStore } from "@stores";
import { preloadCollageTextures } from "../collage/CollageAssets";
import { seededRandom } from "../collage/constants";

// Label letters for each direction: the button always advertises the skin
// you'd switch *to*, set in that skin's own look.
const LABELS: Record<SiteStyle, { text: string; tiles: [string, string][] }> = {
  // Shown while classic: paper scraps.
  classic: {
    text: 'SCRAPBOOK',
    tiles: [['#fbf9f3', '#1c1a17'], ['#b3261e', '#fbf9f3'], ['#d8d2c4', '#1c1a17'], ['#1c1a17', '#d39b22'], ['#b48f63', '#1c1a17'], ['#fbf9f3', '#2b86c5']],
  },
  // Shown while collage: night-sky scraps.
  collage: {
    text: 'NIGHT SKY',
    tiles: [['#10131c', '#fbf9f3'], ['#1f3a5f', '#fbf9f3'], ['#1c1a17', '#d39b22'], ['#2a2f45', '#e8e2d4']],
  },
};

const LABEL_FONTS = ['var(--font-collage-abril)', 'var(--font-soria)', 'var(--font-collage-ultra)', 'var(--font-vercetti)', 'var(--font-collage-elite)'];

// A scissor-cut outline, as a clip-path polygon.
const cutPath = (rand: () => number) => {
  const j = () => (rand() * 9).toFixed(1);
  return `polygon(${j()}% ${j()}%, ${100 - +j()}% ${j()}%, ${100 - +j()}% ${100 - +j()}%, ${j()}% ${100 - +j()}%)`;
};

// A torn edge down both sides of the page-turn sheet.
const tornSheetPath = () => {
  const rand = seededRandom(42);
  const steps = 40;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * 100;
    left.push(`${(rand() * 1.6).toFixed(2)}% ${y}%`);
    right.push(`${(98.4 + rand() * 1.6).toFixed(2)}% ${100 - y}%`);
  }
  return `polygon(${[...left, ...right].join(',')})`;
};

// Wait for the textures and fonts the new skin pulled in, so the sheet lifts on
// a finished page. Gives up after a few seconds on a slow connection.
const settle = (next: SiteStyle) => new Promise<void>((resolve) => {
  const start = performance.now();
  const check = () => {
    const elapsed = performance.now() - start;
    const loaded = !useProgress.getState().active && (next !== 'collage' || useStyleStore.getState().collageReady);
    if ((elapsed > 700 && loaded) || elapsed > 6000) resolve();
    else requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
});

const StyleToggle = () => {
  const style = useStyleStore((state) => state.style);
  const setStyle = useStyleStore((state) => state.setStyle);
  const themeColor = useThemeStore((state) => state.theme.color);
  const sheetRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  // Persisted style isn't known during SSR; render the label only once mounted
  // so the server and first client render agree.
  const [mounted, setMounted] = useState(false);
  const [sheetStyle, setSheetStyle] = useState<SiteStyle>('collage');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.documentElement.dataset.style = style;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', style === 'collage' ? '#8c7152' : themeColor);
  }, [style, themeColor]);

  const label = LABELS[style];
  const letters = useMemo(() => {
    const rand = seededRandom(style === 'collage' ? 9 : 4);
    return label.text.split('').map((char, i) => {
      const [bg, fg] = label.tiles[i % label.tiles.length];
      return {
        char,
        style: {
          background: bg,
          color: fg,
          fontFamily: LABEL_FONTS[(i * 3 + (style === 'collage' ? 1 : 0)) % LABEL_FONTS.length],
          clipPath: cutPath(rand),
          '--r': `${((rand() - 0.5) * 14).toFixed(1)}deg`,
          '--y': `${((rand() - 0.5) * 4).toFixed(1)}px`,
        } as CSSProperties,
      };
    });
  }, [style, label]);

  const tornPath = useMemo(tornSheetPath, []);

  const toggle = async () => {
    const sheet = sheetRef.current;
    if (busy.current || !sheet) return;
    busy.current = true;
    const next: SiteStyle = style === 'collage' ? 'classic' : 'collage';
    setSheetStyle(next);
    // Start downloading while the sheet is still sliding in.
    if (next === 'collage') preloadCollageTextures();

    gsap.set(sheet, { display: 'block' });
    await gsap.fromTo(sheet, { xPercent: 115, rotate: 4 }, { xPercent: 0, rotate: 0, duration: 0.65, ease: 'power3.inOut' });
    setStyle(next);
    await settle(next);
    await gsap.to(sheet, { xPercent: -115, rotate: -4, duration: 0.7, ease: 'power3.inOut' });
    gsap.set(sheet, { display: 'none' });
    busy.current = false;
  };

  return (
    <>
      <button
        type="button"
        className="style-toggle"
        onClick={toggle}
        aria-label={mounted ? `Switch to ${style === 'collage' ? 'night sky' : 'scrapbook'} style` : 'Switch site style'}
        style={{ visibility: mounted ? 'visible' : 'hidden' }}>
        <span className="style-toggle__tape" aria-hidden />
        <span className="style-toggle__letters" aria-hidden>
          {mounted && letters.map(({ char, style: letterStyle }, i) => (
            char === ' '
              ? <span key={i} className="style-toggle__space" />
              : <span key={i} className="style-toggle__letter" style={letterStyle}>{char}</span>
          ))}
        </span>
      </button>
      <div
        ref={sheetRef}
        className={`page-turn page-turn--${sheetStyle}`}
        style={{ clipPath: tornPath, display: 'none' }}
        aria-hidden>
        <div className="page-turn__stamp" />
      </div>
    </>
  );
};

export default StyleToggle;
