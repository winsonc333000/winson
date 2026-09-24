import * as THREE from "three";
import { seededRandom } from "./constants";

// ShapeGeometry's UVs are raw shape coordinates. Remap them either to 0..1 over
// the cut's bounding box (so an image fills the scrap) or to world units (so a
// repeating grain texture stays the same size on every scrap).
const setUVs = (geometry: THREE.BufferGeometry, w: number, h: number, uvScale?: number) => {
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = uvScale ? pos.getX(i) / uvScale : pos.getX(i) / w + 0.5;
    uv[i * 2 + 1] = uvScale ? pos.getY(i) / uvScale : pos.getY(i) / h + 0.5;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
};

interface CutOptions {
  // Torn paper has a fine ragged edge; scissor cuts are a few straight strokes.
  torn?: boolean;
  // How far the edge wanders, in world units.
  roughness?: number;
  uvScale?: number;
}

const cache = new Map<string, THREE.BufferGeometry>();

// The outline of a cut or torn rectangle centred on the origin.
const cutOutline = (w: number, h: number, seed: number, torn: boolean, roughness: number) => {
  const rand = seededRandom(seed * 9973 + 17);
  const jitter = (amount: number) => (rand() * 2 - 1) * amount;
  const corners: [number, number][] = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  const points: THREE.Vector2[] = [];

  corners.forEach(([x0, y0], side) => {
    const [x1, y1] = corners[(side + 1) % 4];
    const length = Math.hypot(x1 - x0, y1 - y0);
    // Outward normal of this side, for pushing edge points in and out.
    const nx = (y1 - y0) / length;
    const ny = -(x1 - x0) / length;
    if (torn) {
      const steps = Math.max(8, Math.round(length / (roughness * 0.9)));
      let drift = 0;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        drift = drift * 0.6 + jitter(roughness * 0.7);
        const d = drift + jitter(roughness * 0.35);
        points.push(new THREE.Vector2(x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d));
      }
    } else {
      points.push(new THREE.Vector2(x0 + jitter(roughness), y0 + jitter(roughness)));
      // Sometimes the scissors re-enter halfway along a side.
      if (rand() < 0.5) {
        const t = 0.3 + rand() * 0.4;
        const d = jitter(roughness * 0.6);
        points.push(new THREE.Vector2(x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d));
      }
    }
  });
  return points;
};

export const cutPaperGeometry = (w: number, h: number, seed: number, options: CutOptions = {}) => {
  const { torn = false, roughness = Math.min(w, h) * 0.04, uvScale } = options;
  const key = [w, h, seed, torn, roughness, uvScale].join('|');
  const cached = cache.get(key);
  if (cached) return cached;

  const shape = new THREE.Shape(cutOutline(w, h, seed, torn, roughness));
  const geometry = setUVs(new THREE.ShapeGeometry(shape), w, h, uvScale);
  cache.set(key, geometry);
  return geometry;
};

// A torn square of paper with a roughly round hole torn through the middle,
// for the rings lining the door well.
export const tornRingGeometry = (size: number, holeRadius: number, seed: number) => {
  const key = ['ring', size, holeRadius, seed].join('|');
  const cached = cache.get(key);
  if (cached) return cached;

  const shape = new THREE.Shape(cutOutline(size, size, seed, true, size * 0.03));
  const rand = seededRandom(seed * 31 + 5);
  const steps = 40;
  const hole = new THREE.Path();
  let drift = 0;
  for (let i = steps; i > 0; i--) {
    const a = (i / steps) * Math.PI * 2;
    drift = drift * 0.6 + (rand() - 0.5) * holeRadius * 0.08;
    const r = holeRadius + drift;
    if (i === steps) hole.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else hole.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.holes.push(hole);
  // A small repeat: the camera passes within a unit of these.
  const geometry = setUVs(new THREE.ShapeGeometry(shape), size, size, 0.9);
  cache.set(key, geometry);
  return geometry;
};

// A flat-bottomed cut-paper cloud: the upper envelope of a row of circles.
export const cloudGeometry = (w: number, h: number, seed: number) => {
  const key = ['cloud', w, h, seed].join('|');
  const cached = cache.get(key);
  if (cached) return cached;

  const rand = seededRandom(seed * 7919 + 3);
  const count = 4 + Math.floor(rand() * 3);
  const circles = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const bulge = Math.sin(Math.PI * t);
    const r = (0.28 + bulge * 0.42 + rand() * 0.14) * h;
    return { x: -w / 2 + r * 0.8 + t * (w - r * 1.6), y: 0, r };
  });

  const points: THREE.Vector2[] = [];
  const samples = 90;
  for (let i = 0; i <= samples; i++) {
    const x = -w / 2 + (w * i) / samples;
    let y = 0;
    circles.forEach((c) => {
      const dx = x - c.x;
      if (Math.abs(dx) < c.r) y = Math.max(y, c.y + Math.sqrt(c.r * c.r - dx * dx));
    });
    points.push(new THREE.Vector2(x, y));
  }
  // Slightly wavy scissor-cut base.
  for (let i = 6; i >= 0; i--) {
    points.push(new THREE.Vector2(-w / 2 + (w * i) / 6, -h * 0.08 + (rand() - 0.5) * h * 0.06));
  }

  const geometry = setUVs(new THREE.ShapeGeometry(new THREE.Shape(points)), w, h, 1.5);
  cache.set(key, geometry);
  return geometry;
};

// Four-point sparkle, like the ink stars in the reference sheets.
let sparkle: THREE.BufferGeometry | null = null;
export const sparkleGeometry = () => {
  if (sparkle) return sparkle;
  const shape = new THREE.Shape();
  const tips: [number, number][] = [[0, 1], [0.55, 0], [0, -1], [-0.55, 0]];
  shape.moveTo(...tips[0]);
  tips.forEach((_, i) => {
    const next = tips[(i + 1) % 4];
    shape.quadraticCurveTo(0, 0, ...next);
  });
  sparkle = new THREE.ShapeGeometry(shape, 6);
  return sparkle;
};
