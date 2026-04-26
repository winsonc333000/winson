import { Stars, useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import { usePortalStore } from "@stores";
import { Encounter } from "../../models/Encounter";
import ProjectsCarousel from "./ProjectsCarousel";
import { TouchPanControls } from "./TouchPanControls";

const Projects = () => {
  const { camera } = useThree();
  const isActive = usePortalStore((state) => state.activePortalId === "projects");
  const data = useScroll();

  useEffect(() => {
    // Hide scrollbar when active.
    data.el.style.overflow = isActive ? 'hidden' : 'auto';
    if (isActive) {
      if (isMobile) {
        gsap.to(camera.position, { z: 11.5, y: -39, x: 1, duration: 1 });
      } else {
        gsap.to(camera.position, { y: -39, x: 2, duration: 1 });
      }
    }
  }, [isActive]);

  useFrame((state, delta) => {
    if (isActive) {
      if (!isMobile) {
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -(state.pointer.x * Math.PI) / 4, 0.03);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 11.5 - state.pointer.y, 7, delta);
      }
    }
  });

  return (
    <group>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={["#000000", 35, 130]} />
      <Stars radius={200} depth={100} count={5000} factor={10} saturation={10} fade={true} speed={1} />
      <ambientLight intensity={0.2} />
      <hemisphereLight args={["#c8d0d8", "#909aaa", 0.3]} />
      <directionalLight castShadow position={[5, 20, 8]} intensity={0.2} color="#f0ece8" shadow-mapSize={[2048, 2048]} />
      <Encounter scale={new THREE.Vector3(2, 2, 2)} position={new THREE.Vector3(2.15, -3.5, -17.5)} rotation={new THREE.Euler(0.05, 2.03, 0)} />


      <ProjectsCarousel />
      { isActive && isMobile && <TouchPanControls /> }
    </group>
  );
};

export default Projects;
