'use client';

import { Text } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";

import { BLACKLETTER_FONT, CUTOUT_FONTS, PAPER, seededRandom } from "./constants";
import { PaperPattern, PaperScrap } from "./PaperScrap";

interface TileStyle {
  // null: the letter itself is the cut-out, sticker style with a white border.
  bg: string | null;
  fg: string;
  pattern?: PaperPattern;
}

// Neutrals are listed more than once so the colour accents stay accents.
const TILE_STYLES: TileStyle[] = [
  { bg: PAPER.white, fg: PAPER.ink },
  { bg: PAPER.ink, fg: PAPER.white },
  { bg: PAPER.newsprint, fg: PAPER.ink, pattern: 'halftone' },
  { bg: PAPER.red, fg: PAPER.white },
  { bg: PAPER.kraft, fg: PAPER.ink },
  { bg: PAPER.white, fg: PAPER.red },
  { bg: PAPER.ink, fg: PAPER.mustard },
  { bg: PAPER.graphite, fg: PAPER.paper, pattern: 'halftone' },
  { bg: null, fg: PAPER.mustard },
  { bg: PAPER.paper, fg: PAPER.ink, pattern: 'ruled' },
  { bg: PAPER.ash, fg: PAPER.white },
  { bg: PAPER.newsprint, fg: PAPER.ink },
  { bg: null, fg: PAPER.red },
  { bg: PAPER.white, fg: PAPER.graphite, pattern: 'halftone' },
];

export interface LetterCut {
  char: string;
  style: TileStyle;
  font: string;
  // Tile size relative to the base cell; rotation and nudge in cell units.
  width: number;
  height: number;
  rotation: number;
  offsetY: number;
  seed: number;
}

// Width of each glyph's cell relative to a letter's. Spaces and punctuation
// sit on narrower (or no) tiles.
export const cellWidth = (char: string) => {
  if (char === ' ') return 0.45;
  if (',.!?\''.includes(char)) return 0.55;
  if ('MW'.includes(char)) return 1.2;
  return 1;
};

// Blackletter I reads as J and S as G; only use it where the capital survives.
const BLACKLETTER_SAFE = 'CDEMNOP';

// Pick a tile for every character, never repeating a style or font back to back.
export const cutLetters = (text: string, seed: number): LetterCut[] => {
  const rand = seededRandom(seed);
  let lastStyle = -1;
  let lastFont = -1;
  return text.split('').map((char, i) => {
    let style = Math.floor(rand() * TILE_STYLES.length);
    if (style === lastStyle) style = (style + 1) % TILE_STYLES.length;
    let font = Math.floor(rand() * CUTOUT_FONTS.length);
    if (font === lastFont) font = (font + 3) % CUTOUT_FONTS.length;
    if (CUTOUT_FONTS[font] === BLACKLETTER_FONT && !BLACKLETTER_SAFE.includes(char)) font = (font + 1) % CUTOUT_FONTS.length;
    lastStyle = style;
    lastFont = font;
    return {
      char,
      style: TILE_STYLES[style],
      font: CUTOUT_FONTS[font],
      width: cellWidth(char) * (0.86 + rand() * 0.12),
      height: 1.12 + rand() * 0.22,
      rotation: (rand() - 0.5) * 0.22,
      offsetY: (rand() - 0.5) * 0.14,
      seed: seed * 100 + i,
    };
  });
};

type GroupProps = ThreeElements['group'];

interface RansomLetterProps extends GroupProps {
  cut: LetterCut;
  // World size of one letter cell.
  cell: number;
}

// One letter snipped out of a magazine and pasted down.
const RansomLetter = ({ cut, cell, ...props }: RansomLetterProps) => {
  const { char, style, font, width, height, seed } = cut;
  if (char === ' ') return <group {...props} />;

  const w = width * cell;
  const h = height * cell;
  const fontSize = cell * (style.bg ? 0.92 : 1.2) * (char === ',' ? 1.2 : 1);
  const textProps = {
    font,
    fontSize,
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
    // Ascenders sit high in most faces; nudge the glyph back to the tile centre.
    position: [0, cell * 0.04, 0.004] as [number, number, number],
  };

  if (!style.bg) {
    return (
      <group {...props}>
        <Text {...textProps} position={[cell * 0.05, -cell * 0.03, 0]} color="#000" fillOpacity={0.25}
          outlineWidth="9%" outlineColor="#000" outlineOpacity={0.25}>
          {char}
        </Text>
        <Text {...textProps} color={style.fg} outlineWidth="9%" outlineColor={PAPER.white}>
          {char}
        </Text>
      </group>
    );
  }

  return (
    <group {...props}>
      <PaperScrap width={w} height={h} seed={seed} color={style.bg} pattern={style.pattern ?? 'grain'}>
        <Text {...textProps} color={style.fg}>{char}</Text>
      </PaperScrap>
    </group>
  );
};

export default RansomLetter;
