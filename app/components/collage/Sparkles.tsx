'use client';

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { PAPER, seededRandom } from "./constants";
import { sparkleGeometry } from "./geometry";

interface SparklesProps {
  count: number;
  seed?: number;
  color?: string;
  size?: [number, number];
  // 'wall': scattered over a width x height rectangle in the group's XY plane.
  // 'sky': on a sphere shell around the origin, each facing the centre, like
  // drei's <Stars>, for the portal scenes.
  layout: { type: 'wall'; width: number; height: number } | { type: 'sky'; radius: number; depth: number };
  twinkle?: boolean;
}

const dummy = new THREE.Object3D();

// Hand-inked four-point stars: the collage stand-in for the starfield.
const Sparkles = ({ count, seed = 1, color = PAPER.ink, size = [0.3, 1], layout, twinkle = false }: SparklesProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const instances = useMemo(() => {
    const rand = seededRandom(seed);
    return Array.from({ length: count }, () => {
      const position = new THREE.Vector3();
      if (layout.type === 'wall') {
        position.set((rand() - 0.5) * layout.width, (rand() - 0.5) * layout.height, rand() * 0.05);
      } else {
        const r = layout.radius + rand() * layout.depth;
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(2 * rand() - 1);
        position.setFromSphericalCoords(r, phi, theta);
      }
      // Few big, many small, like the reference sheets.
      const scale = size[0] + (size[1] - size[0]) * rand() ** 2.5;
      return { position, scale, tilt: (rand() - 0.5) * 0.5, phase: rand() * Math.PI * 2, speed: 0.6 + rand() * 1.4 };
    });
  }, [count, seed, size[0], size[1], layout]);

  const place = (t: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    instances.forEach(({ position, scale, tilt, phase, speed }, i) => {
      dummy.position.copy(position);
      if (layout.type === 'sky') dummy.lookAt(0, 0, 0);
      else dummy.rotation.set(0, 0, 0);
      dummy.rotateZ(tilt);
      const pulse = twinkle ? 0.7 + 0.3 * Math.sin(t * speed + phase) : 1;
      dummy.scale.setScalar(scale * pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => place(0));

  useFrame(({ clock }) => {
    if (twinkle) place(clock.elapsedTime);
  });

  return (
    <instancedMesh ref={meshRef} args={[sparkleGeometry(), undefined, count]} frustumCulled={false}>
      {/* No fog: the portal scenes fog out well short of the sky shell. */}
      <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} depthWrite={false} fog={false} />
    </instancedMesh>
  );
};

export default Sparkles;
