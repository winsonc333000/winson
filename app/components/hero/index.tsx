'use client';

import { Text } from "@react-three/drei";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useIsCollage } from "@stores";
import CollageBackdrop from "../collage/CollageBackdrop";
import CollageTitle from "../collage/CollageTitle";
import { KoiPond } from "../collage/DoorWell";
import PaperClouds from "../collage/PaperClouds";
import CloudContainer from "../models/Cloud";
import StarsContainer from "../models/Stars";
import AsianInspiredDoor from "../models/AsianInspiredDoor";
import TextWindow from "./TextWindow";


// Title sits at z=-10 while the camera starts at z=5, so fit it to the frustum
// slice 15 units away rather than the current (scroll-driven) camera position.
const TITLE_DISTANCE = 15;
// Equal margin on every side, as a fraction of the smaller viewport dimension.
const TITLE_MARGIN = 0.04;
// Gap between lines, as a fraction of the fill height (before vertical stretch).
const TITLE_LINE_GAP = 0.04;
const TITLE_LINES = ["HEY, I AM", "WINSON CHEN"];

// The clouds sit between the camera and the title, so without this they wash
// over the letters. Skipping the depth test draws the title on top of them.
const titleMaterial = new THREE.MeshBasicMaterial({
  color: "white",
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: false,
  depthWrite: false,
});

type Bounds = [number, number, number, number];
type SyncedText = THREE.Mesh & { fontSize: number; textRenderInfo?: { visibleBounds: Bounds } };

// Kept separate from Hero so loading progress, resizes and re-measuring only
// re-render the title, not the clouds, stars and door.
const HeroTitle = () => {
  const titleRef = useRef<THREE.Group>(null);
  const { progress } = useProgress();
  // Selectors matter here: a bare useThree() re-renders on every store change
  // (e.g. AdaptiveDpr), and each re-render makes troika re-typeset the text.
  const size = useThree((s) => s.size);
  const fov = useThree((s) => (s.camera as THREE.PerspectiveCamera).fov ?? 75);
  // Visible glyph bounds of each line at fontSize 1, measured by troika after
  // layout. Each line is sized to span the full width, then the whole block is
  // stretched vertically to span the full height.
  // Keyed by line text so edited copy is re-measured instead of reusing stale bounds.
  const [lineBounds, setLineBounds] = useState<Record<string, Bounds>>({});
  const measured = TITLE_LINES.every((line) => lineBounds[line]);

  useEffect(() => {
    if (progress === 100 && titleRef.current) {
      gsap.fromTo(titleRef.current.position, {
        y: -10,
        duration: 1,
        // delay: 1.5,
      }, {
        y: 0,
        duration: 3
      });
    }
  }, [progress]);

  const lines = useMemo(() => {
    const viewHeight = 2 * TITLE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const viewWidth = viewHeight * (size.width / size.height);
    const margin = Math.min(viewWidth, viewHeight) * TITLE_MARGIN;
    const targetWidth = viewWidth - 2 * margin;
    const targetHeight = viewHeight - 2 * margin;

    const layout = TITLE_LINES.map((line) => {
      const b = lineBounds[line] ?? [0, -1, 1, 0];
      const fontSize = targetWidth / (b[2] - b[0]);
      return { b, fontSize, height: (b[3] - b[1]) * fontSize };
    });
    const gap = targetHeight * TITLE_LINE_GAP;
    const blockHeight = layout.reduce((sum, l) => sum + l.height, 0) + gap * (layout.length - 1);

    let cursor = blockHeight / 2;
    const placed = layout.map(({ b, fontSize, height }) => {
      const x = -targetWidth / 2 - b[0] * fontSize;
      const y = cursor - b[3] * fontSize;
      cursor -= height + gap;
      return { x, y, fontSize };
    });
    return { placed, stretchY: targetHeight / blockHeight };
  }, [fov, size.width, size.height, lineBounds]);

  const handleSync = useCallback((line: string) => (text: SyncedText) => {
    const b = text.textRenderInfo?.visibleBounds;
    if (!b) return;
    const fs = text.fontSize;
    setLineBounds((prev) => (prev[line]
      ? prev
      : { ...prev, [line]: [b[0] / fs, b[1] / fs, b[2] / fs, b[3] / fs] }));
  }, []);

  return (
    <group position={[0, 2, -10]} ref={titleRef} visible={measured}>
      <group scale={[1, lines.stretchY, 1]}>
        {TITLE_LINES.map((line, i) => (
          <Text
            key={line}
            position={[lines.placed[i].x, lines.placed[i].y, 0]}
            font="./Harmoni.ttf"
            fontSize={lines.placed[i].fontSize}
            anchorX={0}
            anchorY={0}
            material={titleMaterial}
            renderOrder={10}
            // Hard offset drop shadow so the white type stays legible over the
            // clouds. No outlineBlur: at this fontSize any blur runs past the SDF's
            // encoded range and tints each glyph's whole quad, which showed up as a
            // dark band between the lines.
            outlineColor="black"
            outlineOpacity={0.45}
            outlineOffsetX="1%"
            outlineOffsetY="-1.4%"
            onSync={handleSync(line)}>
            {line}
          </Text>
        ))}
      </group>
    </group>
  );
};

const Hero = () => {
  const collage = useIsCollage();
  return (
    <>
      {/* The collage skin swaps the starry sky for a paper one. Its pieces load
          their own fonts and textures, so they get their own boundaries rather
          than blanking the whole scene while they do. */}
      {collage ? (
        <>
          <Suspense fallback={null}><CollageTitle /></Suspense>
          <Suspense fallback={null}><CollageBackdrop /></Suspense>
          <PaperClouds />
        </>
      ) : (
        <>
          <HeroTitle />
          <StarsContainer />
          <CloudContainer/>
        </>
      )}
      <group position={[0, -25, 5.69]}>
        {/* No castShadow: a point light renders a 6-face cube shadow map every
            frame, and nothing in the door actually receives shadows. */}
        <pointLight position={[1, 1, 1]} intensity={60} distance={10}/>
        <AsianInspiredDoor position={[0, 0, -0.7]} rotation={[4.7, 0, 0]} scale={0.7} />
        <TextWindow/>
        {collage && <Suspense fallback={null}><KoiPond /></Suspense>}
      </group>
    </>
  );
};

export default Hero;
