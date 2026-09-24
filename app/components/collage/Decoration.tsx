'use client';

import { ThreeElements, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const ignore = () => {};

// Wraps purely visual pieces so the pointer passes through them. Anything
// nested under an interactive mesh would otherwise count as part of it: the
// polaroid frames around the portal tiles opened a portal (and covered the
// footer links) wherever they overhung the photo.
//
// Checked every frame because text inside loads late behind Suspense.
const Decoration = ({ children, ...props }: ThreeElements['group']) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    groupRef.current?.traverse((object) => {
      if (object.raycast !== ignore) object.raycast = ignore;
    });
  });
  return <group ref={groupRef} {...props}>{children}</group>;
};

export default Decoration;
