'use client';

import { Text, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ComponentProps, Suspense, useRef } from "react";
import * as THREE from "three";
import { useIsCollage } from "@stores";
import { PAPER } from "../collage/constants";
import { StampSpiral, TunnelRings } from "../collage/DoorWell";

// In the collage skin the words float over the paper rings lining the well, in
// ink with a thin paper edge so they read against every ring colour.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WindowText = ({ collage, index, ...props }: ComponentProps<typeof Text> & { collage: boolean; index: number }) =>
  collage
    ? <Text {...props} color={PAPER.ink} outlineWidth="3%" outlineColor={PAPER.paper} />
    : <Text {...props} />;

const TextWindow = () => {
  const data = useScroll();
  const collage = useIsCollage();
  const windowRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const c = data.range(0.65, 0.15);

    if (windowRef.current) {
      windowRef.current.setRotationFromAxisAngle(new THREE.Vector3(0, -1, 0), 0.5 *Math.PI * c);
      windowRef.current.position.x =  -0.6 * c;
      windowRef.current.position.z = -0.6 * c;
    }
  });

  const fontProps = {
    font: "./soria-font.ttf",
  };

  return (
    <group position={[0, -0.3, 0]} ref={windowRef}>

      <WindowText collage={collage} index={0} color="white" anchorX="left" anchorY="middle"
        fontSize={1.3}
        position={[0.12, 0, 0]}
        {...fontProps}
        scale={[1, -1, 1]}
        rotation={[0, 0,  -Math.PI / 2]}>
        MARKETING DESIGNER
      </WindowText>

      <WindowText collage={collage} index={1} color="white" anchorX="right" anchorY="middle"
        {...fontProps}
        scale={[-1, -1, 1]}
        fontSize={1.3}
        position={[0.12, 0, -1.4]}
        rotation={[0, 0,  -Math.PI / 2]}>
        DESIGNER. DEVELOPER
      </WindowText>

      <group position={[-0.45, 0, -0.3]}>
        <WindowText collage={collage} index={2} color="white" anchorX="left" anchorY="middle"
          {...fontProps}
          scale={[1, -1, 1]}
          fontSize={0.8}
          rotation={[0, -Math.PI / 2,  -Math.PI / 2]}>
          SOCIAL & CAMPAIGNS
        </WindowText>

        <WindowText collage={collage} index={3} color="white" anchorX="left" anchorY="middle"
          {...fontProps}
          scale={[1, -1, 1]}
          fontSize={0.8}
          position={[0, 0, -0.6]}
          rotation={[0, -Math.PI / 2,  -Math.PI / 2]}>
          UI UX. MARKETING
        </WindowText>
      </group>

      <group position={[0.45, 0, -0.3]}>
        <WindowText collage={collage} index={4} color="white" anchorX="right" anchorY="middle"
          {...fontProps}
          scale={[-1, -1, 1]}
          fontSize={0.8}
          rotation={[0, -Math.PI / 2,  -Math.PI / 2]}>
          FASHION. CREATIVE
        </WindowText>
        <WindowText collage={collage} index={5} color="white" anchorX="right" anchorY="middle"
          {...fontProps}
          scale={[-1, -1, 1]}
          fontSize={0.8}
          position={[0, 0, -0.6]}
          rotation={[0, -Math.PI / 2,  -Math.PI / 2]}>
          CREATIVE. BRANDING
        </WindowText>
      </group>
      {collage && <TunnelRings />}
      {collage && <Suspense fallback={null}><StampSpiral /></Suspense>}
    </group>
  );
}

export default TextWindow;