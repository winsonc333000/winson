'use client';

import { Line, Text, useProgress } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

import { useStyleStore } from "@stores";
import { PENCIL_FONT, PAPER } from "./constants";
import RansomLetter, { cellWidth, cutLetters } from "./RansomLetter";

// Same framing as the classic title: 15 units in front of the starting camera.
const TITLE_DISTANCE = 15;
const LETTER_GAP = 0.1;
const LINE_PITCH = 1.55;

const lineUnits = (line: string) =>
  line.split('').reduce((sum, char) => sum + cellWidth(char) + LETTER_GAP, -LETTER_GAP);

// "HEY, I AM WINSON CHEN" as a ransom note: every letter on its own scrap.
const CollageTitle = () => {
  const { progress } = useProgress();
  const size = useThree((s) => s.size);
  const fov = useThree((s) => (s.camera as THREE.PerspectiveCamera).fov ?? 75);
  const lettersRef = useRef<(THREE.Group | null)[]>([]);
  const setCollageReady = useStyleStore((state) => state.setCollageReady);

  // Mounting means every font in here has loaded (drei's Text suspends until then).
  useEffect(() => {
    setCollageReady(true);
    return () => setCollageReady(false);
  }, [setCollageReady]);

  const aspect = size.width / size.height;
  // Portrait screens get the name split over two lines so the letters stay big.
  const lines = useMemo(() => aspect < 0.85 ? ['HEY, I AM', 'WINSON', 'CHEN'] : ['HEY, I AM', 'WINSON CHEN'], [aspect]);

  const layout = useMemo(() => {
    const viewHeight = 2 * TITLE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const viewWidth = viewHeight * aspect;
    const widest = Math.max(...lines.map(lineUnits));
    const cell = Math.min((viewWidth * 0.86) / widest, (viewHeight * 0.5) / (lines.length * LINE_PITCH));

    let index = 0;
    const letters = lines.flatMap((line, row) => {
      const cuts = cutLetters(line, 7 + row * 31);
      let x = -lineUnits(line) / 2;
      const y = ((lines.length - 1) / 2 - row) * LINE_PITCH;
      return cuts.map((cut) => {
        const cw = cellWidth(cut.char);
        const placed = { cut, index: index++, x: (x + cw / 2) * cell, y: (y + cut.offsetY) * cell };
        x += cw + LETTER_GAP;
        return placed;
      });
    });

    const last = lines.length - 1;
    const note = {
      x: (lineUnits(lines[last]) / 2 - 1.2) * cell,
      y: (((lines.length - 1) / 2 - last) * LINE_PITCH - 1.25) * cell,
    };
    return { cell, letters, note };
  }, [fov, aspect, lines]);

  // Paste the letters down one after another once the scene has loaded. Runs
  // again whenever the layout is rebuilt, since that remounts the letters.
  useEffect(() => {
    if (progress !== 100) return;
    const groups = lettersRef.current.filter(Boolean) as THREE.Group[];
    const tweens = groups.map((group, i) => {
      const cut = layout.letters[i].cut;
      return [
        gsap.fromTo(group.scale, { x: 0.001, y: 0.001, z: 1 }, { x: 1, y: 1, duration: 0.5, delay: 0.4 + i * 0.07, ease: 'back.out(2.2)' }),
        gsap.fromTo(group.rotation, { z: cut.rotation + (i % 2 ? 0.7 : -0.7) }, { z: cut.rotation, duration: 0.6, delay: 0.4 + i * 0.07, ease: 'back.out(2)' }),
      ];
    }).flat();
    return () => tweens.forEach((t) => t.kill());
  }, [progress, layout]);

  const wiggle = (i: number, over: boolean) => {
    if (isMobile) return;
    const group = lettersRef.current[i];
    if (!group) return;
    const base = layout.letters[i].cut.rotation;
    gsap.to(group.rotation, { z: over ? base + (Math.random() - 0.5) * 0.4 : base, duration: 0.35, ease: 'back.out(3)' });
    gsap.to(group.position, { z: over ? 0.3 : 0, duration: 0.3 });
  };

  const { cell, note } = layout;
  const arrow = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-cell * 0.2, cell * 0.05, 0),
      new THREE.Vector3(-cell * 0.9, cell * 0.2, 0),
      new THREE.Vector3(-cell * 1.1, cell * 0.72, 0),
    );
    const points = curve.getPoints(16);
    const tip = points[points.length - 1];
    const head = [
      new THREE.Vector3(tip.x - cell * 0.16, tip.y - cell * 0.16, 0), tip,
      new THREE.Vector3(tip.x + cell * 0.14, tip.y - cell * 0.14, 0),
    ];
    return { points, head };
  }, [cell]);

  return (
    <group position={[0, 1.5, -10]}>
      {layout.letters.map(({ cut, index, x, y }) => (
        <group key={`${lines.length}-${index}`} position={[x, y, 0]}>
          <group
            ref={(g) => { lettersRef.current[index] = g; }}
            rotation={[0, 0, cut.rotation]}
            scale={progress === 100 ? 1 : 0.001}
            onPointerOver={() => wiggle(index, true)}
            onPointerOut={() => wiggle(index, false)}>
            <RansomLetter cut={cut} cell={cell} />
          </group>
        </group>
      ))}
      <group position={[note.x, note.y, 0.2]} rotation={[0, 0, -0.06]}>
        <Text font={PENCIL_FONT} fontSize={cell * 0.46} color={PAPER.red} anchorX="left" anchorY="middle">
          that&apos;s me!
        </Text>
        <Line points={arrow.points} color={PAPER.red} lineWidth={2.5} />
        <Line points={arrow.head} color={PAPER.red} lineWidth={2.5} />
      </group>
    </group>
  );
};

export default CollageTitle;
