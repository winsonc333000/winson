'use client';

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

// Compiles shaders and uploads textures for whichever scene this is mounted in,
// so the work doesn't happen mid-scroll the first time an object is drawn.
//
// drei's <Preload> only reaches the root scene; each MeshPortalMaterial renders
// a separate virtual scene, so mount one of these inside every portal too. It
// must be the last child so everything it should warm has already mounted.
const WarmUp = () => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;

    // three keys programs on output colour space, which differs between a
    // render target (portal preview, linear) and the screen (entered portal,
    // sRGB). Compile for both or entering a portal recompiles everything.
    // compileAsync creates programs synchronously; the driver finishes them in
    // the background, so restoring the target straight away is safe.
    const previousTarget = gl.getRenderTarget();
    const target = new THREE.WebGLRenderTarget(1, 1);
    for (const t of [target, null]) {
      gl.setRenderTarget(t);
      gl.compileAsync(scene, camera).catch(() => {});
    }
    gl.setRenderTarget(previousTarget);
    target.dispose();

    const textures = new Set<THREE.Texture>();
    scene.traverse((object) => {
      const material = (object as THREE.Mesh).material;
      if (!material) return;
      for (const m of Array.isArray(material) ? material : [material]) {
        const values = [
          ...Object.values(m),
          ...Object.values((m as THREE.ShaderMaterial).uniforms ?? {}).map((u) => u?.value),
        ];
        values.forEach((v) => { if (v?.isTexture && v.image) textures.add(v); });
      }
    });

    // Upload one texture per frame so the loader animation keeps moving.
    const queue = [...textures];
    const uploadNext = () => {
      if (cancelled) return;
      const texture = queue.shift();
      if (!texture) return;
      gl.initTexture(texture);
      frame = requestAnimationFrame(uploadNext);
    };
    frame = requestAnimationFrame(uploadNext);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [gl, scene, camera]);

  return null;
};

export default WarmUp;
