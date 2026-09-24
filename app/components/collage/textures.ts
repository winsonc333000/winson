import * as THREE from "three";
import { seededRandom } from "./constants";

// Small procedural textures, multiplied over each scrap's colour. Built once on
// first use and shared, so every scrap costs no extra texture memory.

const make = (size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

const lazy = (build: () => THREE.Texture) => {
  let texture: THREE.Texture | null = null;
  return () => (texture ??= build());
};

// Paper fibre: near-white speckle with a few longer fibres.
export const grainTexture = lazy(() => make(256, (ctx, size) => {
  const rand = seededRandom(11);
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 226 + rand() * 29;
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v - 4;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  ctx.strokeStyle = 'rgba(120, 100, 80, 0.12)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 70; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const a = rand() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * 6 + rand() * 4, y + Math.sin(a) * 6, x + Math.cos(a) * 12, y + Math.sin(a) * 12);
    ctx.stroke();
  }
}));

// Printed halftone, like a scrap torn from a magazine.
export const halftoneTexture = lazy(() => make(128, (ctx, size) => {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  const step = 8;
  for (let y = 0; y <= size; y += step) {
    for (let x = 0; x <= size; x += step) {
      const ox = (y / step) % 2 ? step / 2 : 0;
      ctx.beginPath();
      ctx.arc(x + ox, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}));

// Notebook ruling: pale blue lines. The red margin is added per sheet.
export const ruledTexture = lazy(() => make(128, (ctx, size) => {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(70, 120, 190, 0.55)';
  for (let y = 0; y < size; y += 32) ctx.fillRect(0, y, size, 2);
}));
