import { Text, useScroll, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { PROJECTS } from "@constants";
import { useIsCollage, usePortalStore, useScrollStore } from "@stores";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from 'three';
import { useGLTF } from "@react-three/drei";
import { PAPER } from "../collage/constants";
import RansomLetter, { cutLetters } from "../collage/RansomLetter";
import { extendLoader } from "../models/Encounter";
import GridTile from "./GridTile";
import Projects from "./projects";
import Work from "./work";

const Experience = () => {
  const titleRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const data = useScroll();
  const isActive = usePortalStore((state) => !!state.activePortalId);
  const preloadedRef = useRef(false);
  const setDeferredAssetsReady = useScrollStore((state) => state.setDeferredAssetsReady);
  const collage = useIsCollage();
  const collageCuts = useMemo(() => cutLetters('EXPERIENCE', 23), []);

  const fontProps = {
    font: "./soria-font.ttf",
    fontSize: 0.4,
    color: 'white',
  };

  const loadDeferredAssets = () => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    useGLTF.preload('/models/the_last_stronghold_animated.glb');
    useGLTF.preload('/models/encounter.glb', undefined, undefined, extendLoader as (loader: unknown) => void);
    PROJECTS.forEach((p) => { if (p.image) useTexture.preload(p.image); });
    setDeferredAssetsReady(true);
  };

  // Load while the viewer is still reading the hero, so decoding and GPU
  // upload don't land mid-scroll. The scroll check below is the fallback for
  // anyone who scrolls straight down before this fires.
  useEffect(() => {
    const timer = setTimeout(loadDeferredAssets, 3000);
    return () => clearTimeout(timer);
  }, []);

  useFrame((sate, delta) => {
    const d = data.range(0.8, 0.2);
    const e = data.range(0.7, 0.2);

    if (d > 0) loadDeferredAssets();

    if (groupRef.current && !isActive) {
      groupRef.current.position.y = d > 0 ? -1 : -30;
      groupRef.current.visible = d > 0;
    }

    if (titleRef.current) {
      titleRef.current.children.forEach((text, i) => {
        const y =  Math.max(Math.min((1 - d) * (10 - i), 10), 0.5);
        text.position.y = THREE.MathUtils.damp(text.position.y, y, 7, delta);
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        (text as any).fillOpacity = e;
        // Paper letters can't fade, so they're pasted in by scale instead.
        if (collage) text.scale.setScalar(Math.max(e, 0.001));
      });
    }
  });

  const getTitle = () => {
    const title = 'experience'.toUpperCase();
    return title.split('').map((char, i) => {
      const diff = isMobile ? 0.4 : 0.8;
      if (collage) {
        const cut = collageCuts[i];
        return (
          <group key={i} position={[i * diff, 2, 1]}>
            <group rotation={[0, 0, cut.rotation]}>
              <RansomLetter cut={cut} cell={isMobile ? 0.34 : 0.62} />
            </group>
          </group>
        );
      }
      return (
        <Text key={i} {...fontProps} position={[i * diff, 2, 1]}>{char}</Text>
      );
    });
  };

  return (
    <group position={[0, -41.5, 12]} rotation={[-Math.PI / 2, 0 ,-Math.PI / 2]}>
      {/* <mesh receiveShadow position={[-5, 0, 0.1]}>
        <planeGeometry args={[10, 5, 1]} />
        <shadowMaterial opacity={0.1} />
      </mesh> */}
      <group rotation={[0, 0, Math.PI / 2]}>
        <group ref={titleRef} position={[isMobile ? -1.8 : -3.6, 2, -2]}>
          {/* Collage letters load their own fonts; don't suspend the scene for them. */}
          <Suspense fallback={null}>{getTitle()}</Suspense>
        </group>

        <group position={[0, -1, 0]} ref={groupRef}>
          <GridTile title='WORK AND EDUCATION'
            id="work"
            color={collage ? PAPER.charcoal : '#000000'}
            textAlign='left'
            position={new THREE.Vector3(isMobile ? -1 : -2, 0, isMobile ? 0.4 : 0)}>
            <Work/>
          </GridTile>
          <GridTile title='SIDE PROJECTS'
            id="projects"
            color={collage ? PAPER.charcoal : '#000000'}
            textAlign='right'
            position={new THREE.Vector3(isMobile ? 1 : 2, 0, 0)}>
            <Projects/>
          </GridTile>
        </group>
      </group>
    </group>
  );
};

export default Experience;