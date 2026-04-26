'use client';

import { Edges, useGLTF, useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const AsianInspiredDoor = (props: JSX.IntrinsicElements['group']) => {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/asian_inspired_door.glb');
  const data = useScroll();

  const { frame, leftDoor, rightDoor, leftHingeX, rightHingeX, fullSize, fullCenter } = useMemo(() => {
    const cloned = scene.clone(true);

    const sceneBounds = new THREE.Box3().setFromObject(cloned);
    const sceneSize = sceneBounds.getSize(new THREE.Vector3());
    const sceneCenter = sceneBounds.getCenter(new THREE.Vector3());

    const frame = new THREE.Group();
    const leftDoor = new THREE.Group();
    const rightDoor = new THREE.Group();

    const meshes: THREE.Mesh[] = [];
    cloned.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });

    meshes.forEach((mesh) => {
      // Fix glass material — render as transparent instead of opaque black
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat?.name === 'glass') {
        mat.transparent = true;
        mat.opacity = 0;
        mat.roughness = 0;
        mat.metalness = 0.1;
        mat.needsUpdate = true;
      }

      mesh.updateWorldMatrix(true, false);
      const bounds = new THREE.Box3().setFromObject(mesh);
      const meshSize = bounds.getSize(new THREE.Vector3());
      const meshCenter = bounds.getCenter(new THREE.Vector3());

      // Preserve world transform before reparenting
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      mesh.matrixWorld.decompose(pos, quat, scale);
      mesh.removeFromParent();
      mesh.position.copy(pos);
      mesh.quaternion.copy(quat);
      mesh.scale.copy(scale);

      // Frame spans most of the door width; panels are left/right halves
      if (meshSize.x > sceneSize.x * 0.6) {
        frame.add(mesh);
      } else if (meshCenter.x <= sceneCenter.x) {
        leftDoor.add(mesh);
      } else {
        rightDoor.add(mesh);
      }
    });

    // Left door: hinge at its outer left edge
    // Right door: hinge at its outer right edge
    const leftBounds = new THREE.Box3().setFromObject(leftDoor);
    const rightBounds = new THREE.Box3().setFromObject(rightDoor);

    const leftHingeX = leftBounds.min.x;
    const rightHingeX = rightBounds.max.x;

    // Shift meshes so each hinge edge sits at the group's local origin
    leftDoor.children.forEach((child) => { child.position.x -= leftHingeX; });
    rightDoor.children.forEach((child) => { child.position.x -= rightHingeX; });

    const fullBounds = new THREE.Box3();
    fullBounds.expandByObject(frame);
    fullBounds.expandByObject(leftDoor);
    fullBounds.expandByObject(rightDoor);
    const fullSize = fullBounds.getSize(new THREE.Vector3());
    const fullCenter = fullBounds.getCenter(new THREE.Vector3());

    return { frame, leftDoor, rightDoor, leftHingeX, rightHingeX, fullSize, fullCenter };
  }, [scene]);

  useFrame(() => {
    const progress = data.range(0.5, 0.1);
    if (leftRef.current) {
      leftRef.current.rotation.y = Math.PI * 0.65 * progress;
    }
    if (rightRef.current) {
      rightRef.current.rotation.y = -Math.PI * 0.65 * progress;
    }
  });

  return (
    <group {...props} dispose={null}>
      <mesh position={[fullCenter.x, fullCenter.y, fullCenter.z]}>
        <boxGeometry args={[fullSize.x, fullSize.y, fullSize.z]} />
        <meshBasicMaterial transparent opacity={0} />
        <Edges color="white" lineWidth={1} depthTest={false} renderOrder={1} />
      </mesh>
      <primitive object={frame} />
      <group ref={leftRef} position={[leftHingeX, 0, 0]}>
        <primitive object={leftDoor} />
      </group>
      <group ref={rightRef} position={[rightHingeX, 0, 0]}>
        <primitive object={rightDoor} />
      </group>
    </group>
  );
};

useGLTF.preload('/models/asian_inspired_door.glb');

export default AsianInspiredDoor;
