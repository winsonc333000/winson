'use client';

import { Text } from "@react-three/drei";
import { ComponentProps, forwardRef, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { cutPaperGeometry } from "./geometry";
import { grainTexture } from "./textures";

type TextProps = ComponentProps<typeof Text>;
type Bounds = [number, number, number, number];
type SyncedText = THREE.Mesh & { textRenderInfo?: { blockBounds: Bounds } };

interface LabelTextProps extends TextProps {
  // Colour of the strip behind the text; the text keeps its own `color`.
  tape: string;
  padding?: number;
  seed?: number;
}

// Text on a strip of label tape, sized to whatever the text measures. The strip
// shares the text's transform, so it follows any rotation or mirroring.
//
// Neither depends on facing: the strip is double-sided (some callers mirror the
// text with a negative scale) and skips depth writes, and it draws first, so the
// text lands on top from either side.
const LabelText = forwardRef<THREE.Mesh, LabelTextProps>(({
  tape, padding = 0.35, seed = 1, position, rotation, scale, onSync, children, ...textProps
}, ref) => {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const textRef = useRef<SyncedText | null>(null);

  const measure = useCallback((text: SyncedText) => {
    const b = text.textRenderInfo?.blockBounds;
    if (b) setBounds((prev) => prev && prev.every((v, i) => Math.abs(v - b[i]) < 1e-4) ? prev : [...b] as Bounds);
  }, []);

  const handleSync = useCallback((text: SyncedText) => {
    measure(text);
    onSync?.(text);
  }, [measure, onSync]);

  // onSync only fires for React prop changes. Hover tweens set letterSpacing on
  // the mesh directly, so also re-measure on troika's own sync events, letting
  // the strip stretch with the letters.
  useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const onComplete = () => measure(text);
    text.addEventListener('synccomplete', onComplete);
    return () => text.removeEventListener('synccomplete', onComplete);
  }, [measure]);

  const setTextRef = useCallback((node: SyncedText | null) => {
    textRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  const fontSize = typeof textProps.fontSize === 'number' ? textProps.fontSize : 0.1;
  const pad = fontSize * padding;
  // Round so live letter-spacing tweens don't cut a new geometry every frame.
  const round = (v: number) => Math.round(v / (fontSize * 0.1)) * fontSize * 0.1;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {bounds && (
        <mesh
          position={[(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2, -0.002]}
          geometry={cutPaperGeometry(round(bounds[2] - bounds[0] + pad * 2), round(bounds[3] - bounds[1] + pad * 1.4), seed, { roughness: fontSize * 0.06, uvScale: fontSize * 0.3 })}
          renderOrder={1}>
          <meshBasicMaterial color={tape} map={grainTexture()} side={THREE.DoubleSide} transparent depthWrite={false} />
        </mesh>
      )}
      <Text ref={setTextRef} {...textProps} renderOrder={2} onSync={handleSync}>
        {children}
      </Text>
    </group>
  );
});
LabelText.displayName = 'LabelText';

export default LabelText;
