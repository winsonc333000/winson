'use client';

import { useGLTF } from '@react-three/drei';
import { JSX } from 'react';

export function LaNightCity(props: JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF('models/la_night_city.glb');
  return <primitive object={scene} {...props} />;
}

useGLTF.preload('models/la_night_city.glb');
