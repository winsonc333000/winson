'use client';

import { Billboard } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { PAPER, SHADOW_DEPTH_OFFSET } from "./constants";
import { cloudGeometry } from "./geometry";
import { grainTexture } from "./textures";

interface CloudSpec {
  position: [number, number, number];
  width: number;
  seed: number;
  // Stage flats face the opening view and turn edge-on as the camera tips
  // down; the rest turn to face the camera on the way down.
  flat?: boolean;
}

// Same neighbourhood as the classic volumetric clouds (group at y=-5), plus a
// row along the bottom of the opening view like a paper-theatre stage.
const CLOUDS: CloudSpec[] = [
  { position: [-9, -6.2, -2], width: 8, seed: 1, flat: true },
  { position: [-2.5, -6.8, -1.5], width: 7, seed: 2, flat: true },
  { position: [4, -6.4, -2.2], width: 8.5, seed: 3, flat: true },
  { position: [10.5, -6, -1.8], width: 7.5, seed: 4, flat: true },
  { position: [-4, -10, 0], width: 5.5, seed: 5 },
  { position: [5, -12, 3], width: 4.5, seed: 6 },
  { position: [-10, -15, 4], width: 7, seed: 7 },
  { position: [7, -9, 9], width: 5, seed: 8 },
  { position: [2, -25, 20], width: 9, seed: 9 },
  { position: [11, -20, -5], width: 8, seed: 10 },
  { position: [-13, -30, 12], width: 8, seed: 11 },
];

const backMaterial = new THREE.MeshBasicMaterial({ color: PAPER.newsprint });
const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#2a1e12', transparent: true, opacity: 0.18, depthWrite: false, ...SHADOW_DEPTH_OFFSET });
// Built on first use: the grain texture needs a DOM canvas.
let frontMaterial: THREE.MeshBasicMaterial | null = null;
const getFrontMaterial = () => (frontMaterial ??= new THREE.MeshBasicMaterial({ color: PAPER.white, map: grainTexture() }));

const PaperCloud = ({ width, seed }: { width: number; seed: number }) => {
  const height = width * 0.42;
  const front = cloudGeometry(width, height, seed);
  const back = cloudGeometry(width * 0.9, height * 1.1, seed + 40);
  return (
    <group>
      <mesh geometry={back} material={shadowMaterial} position={[width * 0.1 + 0.12, height * 0.12 - 0.18, -0.02]} />
      <mesh geometry={back} material={backMaterial} position={[width * 0.1, height * 0.12, -0.01]} />
      <mesh geometry={front} material={shadowMaterial} position={[0.14, -0.2, -0.005]} />
      <mesh geometry={front} material={getFrontMaterial()} />
    </group>
  );
};

// Cut-paper clouds in place of the volumetric ones.
const PaperClouds = () => {
  const refs = useRef<(THREE.Group | null)[]>([]);
  // The stage row is laid out for a wide screen; squeeze it onto narrow ones.
  const spread = useThree((s) => Math.min(1, Math.max(0.4, s.size.width / s.size.height / 1.78)));

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((group, i) => {
      const { position, flat } = CLOUDS[i];
      if (group) group.position.x = position[0] * (flat ? spread : 1) + Math.sin(t * 0.25 + i * 1.7) * 0.35;
    });
  });

  return (
    <>
      {CLOUDS.map(({ position, width, seed, flat }, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }} position={position}>
          {flat
            ? <PaperCloud width={width * spread} seed={seed} />
            : <Billboard><PaperCloud width={width} seed={seed} /></Billboard>}
        </group>
      ))}
    </>
  );
};

export default PaperClouds;
