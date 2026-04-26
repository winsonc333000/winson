'use client';

import { useGLTF } from '@react-three/drei';
import { useEffect, JSX } from 'react';
import * as THREE from 'three';

export function DioHorse(props: JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF('models/Dio Horse.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          m.side = THREE.DoubleSide;
          m.transparent = true;
          m.alphaTest = 0.1;
          m.needsUpdate = true;
        });
      }
    });
  }, [scene]);

  return <primitive object={scene} {...props} />;
}

useGLTF.preload('models/Dio Horse.glb');
