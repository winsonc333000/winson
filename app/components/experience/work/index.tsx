import { ScrollControls } from "@react-three/drei";
import { usePortalStore, useScrollStore } from "@stores";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { Stars } from "@react-three/drei";
import { ChineseOldPlace } from "../../models/ChineseOldPlace";
import Timeline from "./Timeline";

const Work = () => {
  const isActive = usePortalStore((state) => state.activePortalId === 'work');
  const { scrollProgress, setScrollProgress } = useScrollStore();

  // Store refs to the scroll wrappers so we don't rely on fragile z-index
  // style queries that break when React re-renders and overwrites manual changes.
  const scrollWrapperRef = useRef<HTMLElement | null>(null);
  const originalScrollWrapperRef = useRef<HTMLElement | null>(null);

  // Stable reference so addEventListener/removeEventListener use the same fn.
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
    setScrollProgress(progress);
  }, [setScrollProgress]);

  // Hack: If the portal is active, add the scroll event listener to the scroll
  // wrapper div. If the portal is not active, remove the scroll event listener.
  // ScrollControls doesn't work out of the box, so we have to manually handle
  // the scroll event.
  useEffect(() => {
    if (isActive) {
      const scrollWrapper = document.querySelector('div[style*="z-index: -1"]') as HTMLElement;
      const originalScrollWrapper = document.querySelector('div[style*="z-index: 1"]') as HTMLElement;
      scrollWrapperRef.current = scrollWrapper;
      originalScrollWrapperRef.current = originalScrollWrapper;
      setScrollProgress(0);
      scrollWrapper.addEventListener('scroll', handleScroll);
      scrollWrapper.style.zIndex = '1';
      originalScrollWrapper.style.zIndex = '-1';
    } else {
      const scrollWrapper = scrollWrapperRef.current;
      const originalScrollWrapper = originalScrollWrapperRef.current;

      if (scrollWrapper) {
        scrollWrapper.scrollTo({ top: 0, behavior: 'smooth' });
        setScrollProgress(0);
        scrollWrapper.removeEventListener('scroll', handleScroll);
        scrollWrapper.style.zIndex = '-1';
      }
      if (originalScrollWrapper) {
        originalScrollWrapper.style.zIndex = '1';
      }
      scrollWrapperRef.current = null;
      originalScrollWrapperRef.current = null;
    }
  }, [isActive, handleScroll]);

  return (
    <group>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 200, 600]} />
      <Stars radius={200} depth={100} count={5000} factor={10} saturation={10} fade={true} speed={1} />
      <hemisphereLight args={['#ffb38a', '#0c1730', 0.45]} />
      <directionalLight position={[-12, 10, 8]} intensity={1.35} color="#ff5d4d" />
      <directionalLight position={[14, 8, 16]} intensity={1.1} color="#5a7cff" />
      <pointLight position={[-2.0, -3.0, 7.0]} intensity={7.5} distance={11.5} color="#ffd18a" />
      <mesh receiveShadow>
        <planeGeometry args={[4, 4, 1]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
      <ScrollControls style={{ zIndex: -1}} pages={2} maxSpeed={0.4}>
        <ChineseOldPlace
          scale={new THREE.Vector3(0.002, 0.002, 0.002)}
          position={new THREE.Vector3(-0.5, -2.7, -8)}
          rotation={new THREE.Euler(1, 1.3, 1)}
        />
        <Timeline progress={isActive ? scrollProgress : 0} />
      </ScrollControls>
    </group>
  );
};

export default Work;
