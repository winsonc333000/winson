'use client';

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { PAPER, StampName } from "./constants";
import { tornRingGeometry } from "./geometry";
import { InkStamp, PhotoScrap } from "./PaperScrap";
import { grainTexture, halftoneTexture } from "./textures";

// The collage version of the passage below the door: instead of the words
// hanging in the dark, you dive down a well of torn paper rings stamped with
// ink, towards a koi pond at the bottom.
//
// Coordinates are TextWindow's: the word walls form a box around TUNNEL_CENTRE
// (the door's centre line) and run down -y for about 12 units. Rings and stamps go inside TextWindow's rotating
// group, so they twist with the words as you pass through.

const TUNNEL_CENTRE: [number, number] = [0, -0.7];
// Clears the corners of the word walls (and the camera, which drifts off-axis
// while the tunnel twists).
const HOLE_RADIUS = 1.25;

const RINGS = [
  { color: PAPER.red, pattern: 'halftone' },
  { color: PAPER.paper, pattern: 'grain' },
  { color: PAPER.jade, pattern: 'halftone' },
  { color: PAPER.mustard, pattern: 'grain' },
  { color: PAPER.navy, pattern: 'halftone' },
  { color: PAPER.kraft, pattern: 'grain' },
  { color: PAPER.magenta, pattern: 'halftone' },
  { color: PAPER.newsprint, pattern: 'grain' },
] as const;

const ringMaterials = new Map<string, THREE.MeshBasicMaterial>();
const ringMaterial = (color: string, pattern: 'halftone' | 'grain') => {
  const key = color + pattern;
  let material = ringMaterials.get(key);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color,
      map: pattern === 'halftone' ? halftoneTexture() : grainTexture(),
      side: THREE.DoubleSide,
    });
    ringMaterials.set(key, material);
  }
  return material;
};

const RING_COUNT = 16;
const ringY = (i: number) => -0.6 - i * 0.78;
const ringTwist = (i: number) => i * 0.4;

// Rings of torn paper lining the well, each turned a little further than the
// one above so their ragged corners spiral down. They sit close together so
// the words in the well always have paper behind them.
export const TunnelRings = () => (
  <group position={[TUNNEL_CENTRE[0], 0, TUNNEL_CENTRE[1]]}>
    {Array.from({ length: RING_COUNT }, (_, i) => {
      const { color, pattern } = RINGS[i % RINGS.length];
      return (
        <mesh
          key={i}
          geometry={tornRingGeometry(3.4 + (i % 3) * 0.25, HOLE_RADIUS, 60 + i)}
          material={ringMaterial(color, pattern)}
          position={[0, ringY(i), 0]}
          rotation={[-Math.PI / 2, 0, ringTwist(i)]} />
      );
    })}
  </group>
);

// Ink stamps pressed onto every other ring, stepping round the well so they
// spiral down with the twist. Those rings are all light paper, so dark ink reads.
const SPIRAL: { name: StampName; width: number }[] = [
  { name: 'key', width: 0.42 },
  { name: 'dragon', width: 0.9 },
  { name: 'fleur', width: 0.7 },
  { name: 'lantern', width: 0.6 },
  { name: 'keySmall', width: 0.3 },
  { name: 'phoenix', width: 1 },
  { name: 'grate', width: 1.05 },
];

export const StampSpiral = () => (
  <group position={[TUNNEL_CENTRE[0], 0, TUNNEL_CENTRE[1]]}>
    {SPIRAL.map(({ name, width }, k) => {
      const ring = 1 + k * 2;
      const angle = ringTwist(ring) + k * 2.1;
      return (
        <group key={name} position={[0, ringY(ring) + 0.02, 0]} rotation={[0, angle, 0]}>
          {/* Pressed into the ring's paper, between the hole and its outer edge. */}
          <InkStamp name={name} width={width} position={[1.72, 0, 0]} opacity={0.85}
            rotation={[-Math.PI / 2, 0, Math.PI / 2 + (k % 2 ? 0.3 : -0.25)]} />
        </group>
      );
    })}
  </group>
);

// The koi print waiting at the bottom of the well, turning like the pond.
// Lives in the door's frame, not the twisting tunnel, directly below the
// camera's path (door-local x=0, z=-0.69).
export const KoiPond = () => {
  const groupRef = useRef<THREE.Group>(null);
  const data = useScroll();
  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.elapsedTime * 0.06 + data.range(0.5, 0.3) * 1.2;
  });
  return (
    <group position={[0, -13.8, -0.69]}>
      <group ref={groupRef}>
        <PhotoScrap name="koiPrint" width={4.4} rotation={[-Math.PI / 2, 0, 0]} />
      </group>
    </group>
  );
};
