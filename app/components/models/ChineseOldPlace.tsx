'use client'

import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const TEXTURE_BASE = '/models/the_last_stronghold_animated_gltf/textures'

const MATERIAL_TEXTURES: Record<string, string> = {
  sky_sketchfab:    `${TEXTURE_BASE}/sky_sketchfab_baseColor.jpeg`,
  final_gate_low:   `${TEXTURE_BASE}/final_gate_low_emissive.jpeg`,
  final_alfa:       `${TEXTURE_BASE}/final_alfa_emissive.jpeg`,
  final_gate_top:   `${TEXTURE_BASE}/final_gate_top_emissive.jpeg`,
  final_B:          `${TEXTURE_BASE}/final_B_emissive.jpeg`,
  final_SOMT:       `${TEXTURE_BASE}/final_SOMT_emissive.jpeg`,
  final_E:          `${TEXTURE_BASE}/final_E_emissive.jpeg`,
  final_A:          `${TEXTURE_BASE}/final_A_emissive.jpeg`,
  final_rope:       `${TEXTURE_BASE}/final_rope_emissive.jpeg`,
  final_C:          `${TEXTURE_BASE}/final_C_emissive.jpeg`,
}

export function ChineseOldPlace({ rotation, ...props }: JSX.IntrinsicElements['group']) {
  const { scene, animations } = useGLTF('/models/the_last_stronghold_animated.glb')
  const { actions } = useAnimations(animations, scene)
  const groupRef = useRef<THREE.Group>(null)
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
    scene.traverse((obj: any) => {
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
    const loader = new THREE.TextureLoader()
    const applied = new Set<string>()

    scene.traverse((obj: any) => {
      if (!obj.isMesh || !obj.material) return
      const mat = obj.material as any
      const name: string = mat.name

      if (applied.has(name)) return
      applied.add(name)

      const texPath = MATERIAL_TEXTURES[name]
      if (!texPath) return

      loader.load(texPath, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.flipY = false
        mat.map = texture
        mat.color.set(0xffffff)
        mat.toneMapped = false
        if (name === 'sky_sketchfab') {
          mat.side = THREE.FrontSide
          obj.visible = true
        }
        mat.needsUpdate = true
      })
    })
  }, [scene])

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y = rotationY.current
  })

  return (
    <group
      ref={groupRef}
      {...props}
      onPointerDown={(e) => { isDragging.current = true; lastX.current = e.clientX; e.stopPropagation() }}
      onPointerMove={(e) => {
        if (!isDragging.current) return
        rotationY.current += (e.clientX - lastX.current) * 0.1
        lastX.current = e.clientX
      }}
      onPointerUp={() => { isDragging.current = false }}
      onPointerLeave={() => { isDragging.current = false }}
    >
      <group rotation={[Math.PI / 1, 0.001, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

