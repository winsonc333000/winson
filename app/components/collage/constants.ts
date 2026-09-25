// Shared look for the collage skin: one palette, one set of cut-out fonts and
// the stamp/photo cut-outs made from the reference artwork in public/collage.

export const PAPER = {
  ink: '#1c1a17',
  paper: '#e7e0d0',
  white: '#fbf9f3',
  newsprint: '#d8d2c4',
  kraft: '#b48f63',
  cardboard: '#8c7152',
  charcoal: '#1f1d1a',
  red: '#b3261e',
  navy: '#1f3a5f',
  mustard: '#d39b22',
  blue: '#2b86c5',
  // Greys that stand in for blue in the hero.
  graphite: '#44413d',
  ash: '#8b867e',
  // Neon-film accents, after the Wong Kar-wai collages.
  jade: '#1f6b4a',
  amber: '#e3a232',
  magenta: '#c8215f',
  tape: '#e9dfc4',
};

// Drop shadows are pushed back in depth, so they lose to the paper they sit
// under even where a page is seen edge-on from far away.
export const SHADOW_DEPTH_OFFSET = { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 };

// Letters are cut from whatever magazine was lying around, so every tile picks
// its own face. Troika needs ttf/otf/woff, not woff2.
export const BLACKLETTER_FONT = '/collage/fonts/UnifrakturMaguntia-Book.ttf';

export const CUTOUT_FONTS = [
  '/collage/fonts/AbrilFatface-Regular.ttf',
  BLACKLETTER_FONT,
  '/collage/fonts/SpecialElite-Regular.ttf',
  '/collage/fonts/Anton-Regular.ttf',
  '/collage/fonts/Ultra-Regular.ttf',
  '/collage/fonts/RubikMonoOne-Regular.ttf',
  '/soria-font.ttf',
  '/Harmoni.ttf',
];

// Handwriting for notes and captions.
export const PENCIL_FONT = '/QuickPencilRegular-0R59.ttf';
export const TYPEWRITER_FONT = '/collage/fonts/SpecialElite-Regular.ttf';
export const LABEL_FONT = '/Vercetti-Regular.woff';
// Brush calligraphy, subset to just 星夜 ("starry night").
export const BRUSH_FONT = '/collage/fonts/MaShanZheng-subset.ttf';

// Ink stamps are white RGB + alpha so the material colour decides the ink.
// Stamps may repeat across scenes; photos are each placed once.
export const STAMPS = {
  phoenix: '/collage/phoenix.webp',
  // Cybersigilism.
  vine: '/collage/vine.webp',
  swirl: '/collage/swirl.webp',
  baroque: '/collage/baroque.webp',
  blossom: '/collage/blossom.webp',
  dragon: '/collage/dragon.webp',
  grate: '/collage/grate.webp',
  key: '/collage/key.webp',
  keySmall: '/collage/key-small.webp',
  lantern: '/collage/lantern.webp',
  fleur: '/collage/fleur.webp',
  filmFrame: '/collage/film-frame.webp',
  inkEye: '/collage/ink-eye.webp',
  // Line art only, printed in red ink.
  jojo: '/collage/jojo.webp',
} as const;

// Photo scraps and stickers keep their own pixels inside their cut outline.
// Each is only ever shown at or below its source resolution.
export const PHOTOS = {
  eye: '/collage/eye.webp',
  loneTree: '/collage/lone-tree.webp',
  trees: '/collage/trees.webp',
  note: '/collage/note.webp',
  grungeCollage: '/collage/grunge-collage.webp',
  roseCross: '/collage/rose-cross.webp',
  laptop: '/collage/laptop.webp',
  eightballCard: '/collage/eightball-card.webp',
  koiPrint: '/collage/koi-print.webp',
  wkwTitle: '/collage/wkw-title.webp',
  wkwFallen: '/collage/wkw-fallen.webp',
  // Manga and poster panels, reprinted as warm ink on newsprint.
  tvStack: '/collage/tv-stack.webp',
  angelWings: '/collage/angel-wings.webp',
  gogglesCamera: '/collage/goggles-camera.webp',
  gogglesRadio: '/collage/goggles-radio.webp',
  neighborhood: '/collage/neighborhood.webp',
  snowFigure: '/collage/snow-figure.webp',
  starryManga: '/collage/starry-manga.webp',
  vagabond: '/collage/vagabond.webp',
  f1Blueprint: '/collage/f1-blueprint.webp',
  sketchTowers: '/collage/sketch-towers.webp',
  // Duotoned city cut-outs for the zoom down to the door.
  bridge: '/collage/bridge.webp',
  petronas: '/collage/petronas.webp',
  // Film stills, each already set in a frame of the ink film strip.
  filmSmoke: '/collage/film-smoke.webp',
  filmAquarium: '/collage/film-aquarium.webp',
  filmNeon: '/collage/film-neon.webp',
  filmNoodles: '/collage/film-noodles.webp',
  filmPhone: '/collage/film-phone.webp',
  filmPoster: '/collage/film-poster.webp',
} as const;

// Sky shell for the portal scenes, where drei's <Stars> sit in the classic skin.
export const PORTAL_SKY = { type: 'sky', radius: 120, depth: 90 } as const;

export type StampName = keyof typeof STAMPS;
export type PhotoName = keyof typeof PHOTOS;

export const ALL_COLLAGE_TEXTURES = [...Object.values(STAMPS), ...Object.values(PHOTOS)];

// Deterministic randomness so every visit cuts the same collage.
export const seededRandom = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};
