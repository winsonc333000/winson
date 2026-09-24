'use client';

import { useGSAP } from "@gsap/react";
import { AdaptiveDpr, Preload, ScrollControls, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { Suspense, useEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";

import { useIsCollage, useThemeStore } from "@stores";

import CollageAssets from "../collage/CollageAssets";
import { PAPER } from "../collage/constants";
import { tornClipPath } from "../collage/tornEdge";
import Preloader from "./Preloader";
import ProgressLoader from "./ProgressLoader";
import { ScrollHint } from "./ScrollHint";
import StyleToggle from "./StyleToggle";
import ThemeSwitcher from "./ThemeSwitcher";
import WarmUp from "./WarmUp";
// import {Perf} from "r3f-perf"

const CanvasLoader = (props: { children: React.ReactNode }) => {
  const ref= useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundColor = useThemeStore((state) => state.theme.color);
  const { progress } = useProgress();
  const collage = useIsCollage();
  const [tornPath] = useState(() => tornClipPath(3));
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0,
    overflow: "hidden",
  });

  useEffect(() => {
    if (!isMobile) {
      const borderStyle = {
        inset: '1rem',
        width: 'calc(100% - 2rem)',
        height: 'calc(100% - 2rem)',
      };
      setCanvasStyle({ ...canvasStyle, ...borderStyle})
    }
  }, [isMobile]);

  useGSAP(() => {
    if (progress === 100) {
      gsap.to('.base-canvas', { opacity: 1, duration: 1, delay: 0.2 });
    }
  }, [progress]);

  useGSAP(() => {
    gsap.to(ref.current, {
      backgroundColor: collage ? PAPER.cardboard : backgroundColor,
      duration: 1,
    });
    // In the collage skin the canvas is see-through, showing the paper sheet
    // behind it, so it drops the noise too.
    const { backgroundImage, ...noiseLayout } = noiseOverlayStyle;
    gsap.to(canvasRef.current, {
      backgroundColor: collage ? 'rgba(0, 0, 0, 0)' : backgroundColor,
      duration: 1,
      ...noiseLayout,
    });
    gsap.set(canvasRef.current, { backgroundImage: collage ? 'none' : backgroundImage });
  }, [backgroundColor, collage]);

  const noiseOverlayStyle = {
    backgroundBlendMode: "soft-light",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E\")",
    backgroundRepeat: "repeat",
    backgroundSize: "100px",
  };

  // On desktop the canvas sits inset in a border; in the collage skin that
  // border is the cardboard the torn page is pasted on.
  const framed = canvasStyle.inset !== undefined;
  const torn = collage && framed ? tornPath : undefined;

  return (
    <div className="h-[100dvh] wrapper relative">
      <div className="h-[100dvh] relative" ref={ref}>
        {torn && (
          <div className="collage-sheet-shadow" style={{ inset: canvasStyle.inset }}>
            <div style={{ clipPath: torn }} />
          </div>
        )}
        {collage && <div className="collage-sheet" style={{ inset: framed ? canvasStyle.inset : 0, clipPath: torn }} />}
        <Canvas className="base-canvas"
          flat
          shadows
          style={{ ...canvasStyle, clipPath: torn }}
          ref={canvasRef}
          dpr={[1.5, 2]}>
          {/* <Perf/> */}
          {/* Collage paints its paper inside WebGL so the canvas stays opaque; a
              see-through canvas under the grain overlay flashed black in some
              browsers while scrolling. */}
          {collage && <color attach="background" args={[PAPER.paper]} />}
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />

            <ScrollControls pages={4} damping={0.4} maxSpeed={1} distance={1} style={{ zIndex: 1 }}>
              {props.children}
              <Preloader />
            </ScrollControls>

            <Preload all />
            <WarmUp />
            {collage && (
              <Suspense fallback={null}>
                <CollageAssets />
                <WarmUp />
              </Suspense>
            )}
          </Suspense>
          <AdaptiveDpr pixelated/>
        </Canvas>
        <ProgressLoader progress={progress} />
        {collage && <div className="collage-grain" />}
      </div>
      <ThemeSwitcher />
      <StyleToggle />
      <ScrollHint />
    </div>
  );
};

export default CanvasLoader;