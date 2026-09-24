'use client';

import { Text, useTexture } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";

import { PAPER, PENCIL_FONT, PHOTOS, PhotoName, STAMPS, StampName } from "./constants";
import { cutPaperGeometry } from "./geometry";
import { grainTexture, halftoneTexture, ruledTexture } from "./textures";

type GroupProps = ThreeElements['group'];

const PATTERNS = {
  grain: { texture: grainTexture },
  halftone: { texture: halftoneTexture },
  ruled: { texture: ruledTexture },
};

export type PaperPattern = keyof typeof PATTERNS;

// Light comes from the top left, so every cut-out drops its shadow down-right,
// further for bigger pieces but never so far it detaches from them.
const shadowOffset = (size: number) => {
  const d = Math.min(size * 0.025, 0.45);
  return [d * 0.7, -d, -0.004] as [number, number, number];
};

const shadowMaterial = new THREE.MeshBasicMaterial({
  color: '#2a1e12',
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});

interface PaperScrapProps extends GroupProps {
  width: number;
  height: number;
  seed: number;
  color?: string;
  pattern?: PaperPattern;
  torn?: boolean;
  shadow?: boolean;
  // Notebook paper gets its red margin line.
  margin?: boolean;
}

// A single piece of cut or torn paper, with a drop shadow and anything passed
// as children laid on top of it.
export const PaperScrap = ({
  width, height, seed, color = PAPER.paper, pattern = 'grain', torn = false,
  shadow = true, margin = false, children, ...props
}: PaperScrapProps) => {
  const size = Math.max(width, height);
  const { texture } = PATTERNS[pattern];
  // Patterns repeat at a fixed pitch in world units rather than stretching
  // with the sheet, so big sheets don't magnify the texture into blur.
  // Halftone dots also shrink on narrow strips.
  const uvScale = pattern === 'ruled' ? 3.2 : pattern === 'halftone' ? Math.min(Math.min(width, height) * 0.9, 3) : 3;
  const geometry = cutPaperGeometry(width, height, seed, { torn, uvScale, roughness: torn ? Math.min(size * 0.012, 0.12) : undefined });

  return (
    <group {...props}>
      {shadow && (
        <mesh geometry={geometry} material={shadowMaterial} position={shadowOffset(size)} />
      )}
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} map={texture()} />
      </mesh>
      {margin && (
        <mesh position={[-width * 0.32, 0, 0.003]}>
          <planeGeometry args={[Math.max(0.03, width * 0.006), height * 0.98]} />
          <meshBasicMaterial color="#d0413b" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      )}
      <group position={[0, 0, 0.006]}>{children}</group>
    </group>
  );
};

const useCrispTexture = (src: string) => {
  const texture = useTexture(src);
  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);
  return texture;
};

const aspectOf = (texture: THREE.Texture) => {
  const image = texture.image as { width: number; height: number } | undefined;
  return image ? image.height / image.width : 1;
};

interface StampProps extends GroupProps {
  name: StampName;
  width: number;
  color?: string;
  opacity?: number;
}

// Rubber-stamped ink from the reference sheets. Stamps are white with alpha, so
// `color` picks the ink: dark on paper, white on the charcoal portal pages.
export const InkStamp = ({ name, width, color = PAPER.ink, opacity = 0.88, ...props }: StampProps) => {
  const texture = useCrispTexture(STAMPS[name]);
  const height = width * aspectOf(texture);
  return (
    <group {...props}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
    </group>
  );
};

interface PhotoProps extends GroupProps {
  name: PhotoName;
  width: number;
  // Pencilled into the bottom corner, for the drawings.
  signature?: string;
}

// A torn photo scrap. The shadow reuses the photo's alpha so it follows the tear.
export const PhotoScrap = ({ name, width, signature, children, ...props }: PhotoProps) => {
  const texture = useCrispTexture(PHOTOS[name]);
  const height = width * aspectOf(texture);
  const shadow = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture, color: '#000', transparent: true, opacity: 0.28, depthWrite: false,
  }), [texture]);
  return (
    <group {...props}>
      <mesh material={shadow} position={shadowOffset(Math.max(width, height))}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.02} />
      </mesh>
      {signature && (
        <Text font={PENCIL_FONT} fontSize={width * 0.065} color={PAPER.graphite} fillOpacity={0.85}
          anchorX="right" anchorY="bottom" rotation={[0, 0, 0.04]}
          position={[width * 0.42, -height / 2 + width * 0.06, 0.005]}>
          {signature}
        </Text>
      )}
      <group position={[0, 0, 0.006]}>{children}</group>
    </group>
  );
};

interface TapeProps extends GroupProps {
  width?: number;
  seed?: number;
}

// A strip of masking tape: translucent, with torn ends.
export const Tape = ({ width = 1.4, seed = 1, ...props }: TapeProps) => {
  const height = width * 0.32;
  const geometry = cutPaperGeometry(width, height, seed + 500, { torn: true, roughness: height * 0.08, uvScale: width });
  return (
    <group {...props}>
      <mesh geometry={geometry} position={[0, 0, 0.01]} renderOrder={2}>
        <meshBasicMaterial color={PAPER.tape} map={grainTexture()} transparent opacity={0.78} depthWrite={false} />
      </mesh>
    </group>
  );
};
