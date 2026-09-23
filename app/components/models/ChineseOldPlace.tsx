'use client'

import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { usePortalStore } from '@stores'

export function ChineseOldPlace({ rotation, ...props }: JSX.IntrinsicElements['group']) {
  const { scene, animations } = useGLTF('/models/the_last_stronghold_animated.glb')
  const { actions } = useAnimations(animations, scene)
  const groupRef = useRef<THREE.Group>(null)
  const isActive = usePortalStore((state) => state.activePortalId === 'work')
  const isDragging = useRef(false)
  const lastX = useRef(0)
  const rotationY = useRef<number>(
    rotation instanceof THREE.Euler ? rotation.y :
    Array.isArray(rotation) ? ((rotation[1] as number) ?? 0) : 0
  )

  useEffect(() => {
    actions['Scene']?.play()
  }, [actions])

  useEffect(() => {
    // Reset cached GLTF scene to avoid accumulated offsets from previous mounts
    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)
    scene.updateMatrixWorld(true)

    // Compute bounding box of visible meshes only (exclude sky sphere)
    const box = new THREE.Box3()
    scene.traverse((object) => {
      const obj = object as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
      if (!obj.isMesh) return
      if (obj.material?.name === 'sky_sketchfab') {
        obj.visible = false
        return
      }
      box.union(new THREE.Box3().setFromObject(obj))
    })

    // Center scene at origin in its original (un-rotated) local space.
    // The rotation wrapper group below will then rotate around this center.
    const center = box.getCenter(new THREE.Vector3())
    scene.position.set(-center.x, -center.y, -center.z)
  }, [scene])

  useEffect(() => {
    // These materials declare KHR_materials_unlit, so three builds a
    // MeshBasicMaterial — it has no `emissive`/`emissiveMap` and ignores
    // lighting entirely. The artwork therefore has to arrive via `map`, which
    // the GLB supplies as baseColorTexture; nothing needs assigning here.
    scene.traverse((object) => {
      const obj = object as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
      if (!obj.isMesh || !obj.material) return
      const mat = obj.material
      mat.toneMapped = false
      if (mat.name === 'sky_sketchfab') {
        mat.side = THREE.FrontSide
        obj.visible = true
      }
    })
  }, [scene])

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y = rotationY.current
  })

  return (
    <group
      ref={groupRef}
      {...props}
      // Only attach drag handlers while the portal is open: any handler makes
      // R3F raycast this skinned mesh vertex-by-vertex on every pointer and
      // wheel event, which stalled scrolling past the Work tile.
      onPointerDown={isActive ? (e) => { isDragging.current = true; lastX.current = e.clientX; e.stopPropagation() } : undefined}
      onPointerMove={isActive ? (e) => {
        if (!isDragging.current) return
        rotationY.current += (e.clientX - lastX.current) * 0.1
        lastX.current = e.clientX
      } : undefined}
      onPointerUp={isActive ? () => { isDragging.current = false } : undefined}
      onPointerLeave={isActive ? () => { isDragging.current = false } : undefined}
    >
      <group rotation={[Math.PI / 1, 0.001, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

// Preload is deferred to scroll position in experience/index.tsx
