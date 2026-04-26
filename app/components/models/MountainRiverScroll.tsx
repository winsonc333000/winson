'use client';

import { useGLTF } from '@react-three/drei';
import { JSX } from 'react';
import * as THREE from 'three';

export function MountainRiverScroll(props: JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF('models/mountain_and_river_scroll.glb');
  return <primitive object={scene} {...props} />;
}

useGLTF.preload('models/mountain_and_river_scroll.glb');
