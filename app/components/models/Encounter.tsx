'use client';

import { useGLTF } from '@react-three/drei';
import { JSX } from 'react';
import { TiltShaderLoader } from 'three-icosa';
import * as THREE from 'three';

// --- Module-level singletons and constants --------------------------------

// One TiltShaderLoader is shared across all calls.
// load() mutates the global materialParams object (replaces URL strings with
// loaded GLSL text), so a second instance would try to fetch GLSL as a URL.
const tiltLoader = new TiltShaderLoader();
tiltLoader.setPath('/brushes/');

// Tiltbrush fog formula: fogFactor = exp2(-(clipZ * density/0.693 * 10))
// At samurai distance (~28 units), density=0.004 → 32% color visible (hazy)
// At mountains (~60 units), density=0.004 → 9% color (nearly white mist)
const FOG_VEC3    = new THREE.Vector3(0.965, 0.968, 0.972);
const FOG_DENSITY = 0.002;

// Lighting: ink-painting look.
// Tiltbrush shaders read these custom uniforms, NOT Three.js standard lights.
const AMBIENT       = new THREE.Vector4(0.35, 0.35, 0.35, 1.0);
const LIGHT0_COLOR  = new THREE.Vector4(0.7,  0.68, 0.62, 1.0); // warm main
const LIGHT1_COLOR  = new THREE.Vector4(0.22, 0.24, 0.32, 1.0); // cool fill
// mat3(matrix) * vec3(0,0,1) gives the light direction in camera space.
const LIGHT0_MATRIX = new THREE.Matrix4().makeRotationX(-Math.PI / 5);
const LIGHT1_MATRIX = new THREE.Matrix4().makeRotationX(Math.PI / 4);

// --- Helpers ---------------------------------------------------------------

// Three.js prepends "#version 300 es\n" for GLSL3 materials.
// Tiltbrush shader files also start with "#version 300 es".
// Strip it from the source to avoid a duplicate-version compile error.
function stripVersion(src: string): string {
  return src.replace(/^#version\s[^\n]*\n/, '');
}

// Rename attribute 'from' → 'to' if 'to' doesn't exist yet.
function alias(geo: THREE.BufferGeometry, from: string, to: string): void {
  const attr = geo.getAttribute(from);
  if (attr && !geo.getAttribute(to)) geo.setAttribute(to, attr);
}

// Set up the attribute names Tiltbrush shaders expect (a_position, a_normal,
// a_texcoord0, a_color) from the Three.js GLTFLoader conventions.
function setupGeometry(geo: THREE.BufferGeometry): void {
  alias(geo, 'position', 'a_position');
  alias(geo, 'normal',   'a_normal');
  alias(geo, 'uv',       'a_texcoord0');
  alias(geo, 'uv1',      'a_texcoord1');
  // Tiltbrush shaders read a_color directly as stored in the GLB.
  // No color-space conversion — the official three-icosa extension does none.
  alias(geo, 'color', 'a_color');
}

// Load a Tiltbrush shader, clone it (so each mesh has independent uniforms),
// apply scene uniforms, and assign to the mesh.
function loadAndApplyShader(mesh: THREE.Mesh, brushName: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tiltLoader.load(
      brushName,
      (raw) => {
        try {
          const base = raw as THREE.RawShaderMaterial;
          const mat  = base.clone() as THREE.RawShaderMaterial;

          // Strip version directive so Three.js can prepend its own via glslVersion.
          mat.vertexShader   = stripVersion(mat.vertexShader);
          mat.fragmentShader = stripVersion(mat.fragmentShader);

          // Fog uniforms (Tiltbrush-specific names, not Three.js standard fog).
          if (mat.uniforms.u_fogColor)   mat.uniforms.u_fogColor.value   = FOG_VEC3;
          if (mat.uniforms.u_fogDensity) mat.uniforms.u_fogDensity.value = FOG_DENSITY;

          // Scene-light uniforms (also Tiltbrush-specific).
          if (mat.uniforms.u_ambient_light_color)  mat.uniforms.u_ambient_light_color.value  = AMBIENT;
          if (mat.uniforms.u_SceneLight_0_color)   mat.uniforms.u_SceneLight_0_color.value   = LIGHT0_COLOR;
          if (mat.uniforms.u_SceneLight_1_color)   mat.uniforms.u_SceneLight_1_color.value   = LIGHT1_COLOR;
          if (mat.uniforms.u_SceneLight_0_matrix)  mat.uniforms.u_SceneLight_0_matrix.value  = LIGHT0_MATRIX;
          if (mat.uniforms.u_SceneLight_1_matrix)  mat.uniforms.u_SceneLight_1_matrix.value  = LIGHT1_MATRIX;

          mesh.material = mat;
          resolve();
        } catch (err) {
          console.error('[Encounter] shader setup error for', brushName, err);
          reject(err);
        }
      },
      undefined,
      (err) => {
        console.error('[Encounter] shader load failed for', brushName, err);
        reject(err);
      }
    );
  });
}

// --- GLTF extension --------------------------------------------------------

// Registered as a GLTFLoader plugin so materials are applied during loading,
// before the component first renders (no async flash of the fallback material).
// Three.js GLTFLoader calls afterRoot() and awaits its result.
function makeTiltBrushPlugin(_parser: unknown) {
  return {
    name: 'TiltBrushPlainNames',

    async afterRoot(glTF: { scenes: THREE.Group[] }) {
      const tasks: Promise<void>[] = [];

      for (const scene of glTF.scenes) {
        scene.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;

          const matName = Array.isArray(obj.material)
            ? obj.material[0]?.name
            : (obj.material as THREE.Material | undefined)?.name;

          if (!matName) return;

          const brushName = tiltLoader.lookupMaterialName(matName);
          if (!brushName) {
            console.warn('[Encounter] No brush for material:', matName);
            return;
          }

          setupGeometry(obj.geometry);

          tasks.push(
            loadAndApplyShader(obj, brushName).catch((e) =>
              console.warn('[Encounter] Skipping', brushName, '-', e)
            )
          );
        });
      }

      return Promise.all(tasks);
    },
  };
}

// Stable module-level function — required for useLoader's cache key to remain
// consistent between renders (inline arrow functions would create a new cache
// entry every time).
function extendLoader(loader: { register: (cb: (p: unknown) => unknown) => void }) {
  loader.register(makeTiltBrushPlugin);
}

// --- Component -------------------------------------------------------------

export function Encounter(props: JSX.IntrinsicElements['group']) {
  // useGLTF suspends until the GLTF (including the afterRoot processing above)
  // is fully loaded.  By then all Tiltbrush materials are already applied.
  const { scene } = useGLTF(
    '/models/encounter.glb',
    undefined,
    undefined,
    extendLoader as (loader: unknown) => void
  );

  return <primitive object={scene} {...props} />;
}

useGLTF.preload(
  '/models/encounter.glb',
  undefined,
  undefined,
  extendLoader as (loader: unknown) => void
);
