'use client';

import { Billboard, Line, Text, useScroll } from "@react-three/drei";
import { ThreeElements, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { BRUSH_FONT, LABEL_FONT, PAPER, PhotoName, TYPEWRITER_FONT } from "./constants";
import { InkStamp, PaperScrap, PhotoScrap, Tape } from "./PaperScrap";
import RansomLetter, { cutLetters } from "./RansomLetter";
import Sparkles from "./Sparkles";

// Ink stamps repeat between scenes; each photo appears once on the page, and
// only at or below the size its source resolution supports.

type GroupProps = ThreeElements['group'];

const WALL_SPARKLES = { type: 'wall', width: 80, height: 46 } as const;
const FLOOR_SPARKLES = { type: 'wall', width: 90, height: 50 } as const;

// Typewritten caption, the way scrapbook clippings get labelled.
const Caption = ({ children, size = 0.5, ...props }: { children: string; size?: number } & GroupProps) => (
  <group {...props}>
    <Text font={TYPEWRITER_FONT} fontSize={size} color={PAPER.ink} anchorX="left" anchorY="top" fillOpacity={0.8}>
      {children}
    </Text>
  </group>
);

// Hairline crop marks and a tiny label, like an editorial lookbook layout.
const EditorialMarks = ({ width, height, label, ...props }: { width: number; height: number; label: string } & GroupProps) => {
  const corners = useMemo(() => {
    const w = width / 2;
    const h = height / 2;
    const l = Math.min(width, height) * 0.14;
    return [[-w, -h, 1, 1], [w, -h, -1, 1], [w, h, -1, -1], [-w, h, 1, -1]].map(([x, y, sx, sy]) => [
      new THREE.Vector3(x + sx * l, y, 0), new THREE.Vector3(x, y, 0), new THREE.Vector3(x, y + sy * l, 0),
    ]);
  }, [width, height]);
  return (
    <group {...props}>
      {corners.map((points, i) => <Line key={i} points={points} color={PAPER.ink} lineWidth={1} transparent opacity={0.7} />)}
      <Text font={LABEL_FONT} fontSize={Math.min(width, height) * 0.045} color={PAPER.ink} anchorX="left" anchorY="bottom"
        position={[-width / 2, height / 2 + Math.min(width, height) * 0.03, 0]} letterSpacing={0.12} fillOpacity={0.75}>
        {label}
      </Text>
    </group>
  );
};

// A word in ransom-note letters, centred on the group.
const RansomWord = ({ word, cell, seed, ...props }: { word: string; cell: number; seed: number } & GroupProps) => {
  const cuts = useMemo(() => cutLetters(word, seed), [word, seed]);
  const pitch = cell * 1.05;
  return (
    <group {...props}>
      {cuts.map((cut, i) => (
        <group key={i} position={[(i - (cuts.length - 1) / 2) * pitch, cut.offsetY * cell, i * 0.01]} rotation={[0, 0, cut.rotation]}>
          <RansomLetter cut={cut} cell={cell} />
        </group>
      ))}
    </group>
  );
};

// 星夜, "starry night", brushed onto torn neon paper like a film poster title.
const StarryNightTiles = (props: GroupProps) => (
  <group {...props}>
    <PaperScrap width={3.4} height={4} seed={71} torn color={PAPER.magenta} position={[-1.8, 0.2, 0]} rotation={[0, 0, 0.06]}>
      <Text font={BRUSH_FONT} fontSize={3} color={PAPER.white} anchorX="center" anchorY="middle">星</Text>
    </PaperScrap>
    <PaperScrap width={3.4} height={4.2} seed={72} torn color={PAPER.white} position={[1.7, -0.3, 0.05]} rotation={[0, 0, -0.05]}>
      <Text font={BRUSH_FONT} fontSize={3.1} color={PAPER.navy} anchorX="center" anchorY="middle">夜</Text>
    </PaperScrap>
    <Caption position={[-3.4, -2.6, 0.1]} size={0.42}>starry night</Caption>
  </group>
);

// The wall behind the hero title, replacing the starfield. The camera looks
// down -z from z=5, so this sits ~30 units away and spans the whole view.
const HeroWall = ({ spread }: { spread: number }) => {
  const x = (value: number) => value * spread;
  return (
    <group position={[0, 1, -25]}>
      {/* Base layers: torn sheets and strips, after the torn-paper reference. */}
      <PaperScrap width={17} height={22} seed={1} torn pattern="ruled" color={PAPER.white} margin
        position={[x(-19), 3, -1]} rotation={[0, 0, 0.07]} />
      <PaperScrap width={20} height={15} seed={2} torn color={PAPER.kraft}
        position={[x(20), -5, -1.2]} rotation={[0, 0, -0.09]} />
      <PaperScrap width={95} height={3.4} seed={3} torn color={PAPER.red} pattern="halftone"
        position={[0, 9, -0.6]} rotation={[0, 0, -0.26]} />
      <PaperScrap width={95} height={2.2} seed={4} torn color={PAPER.graphite} pattern="halftone"
        position={[0, -8, -0.5]} rotation={[0, 0, -0.26]} />
      <PaperScrap width={14} height={9} seed={5} torn color={PAPER.newsprint} pattern="halftone"
        position={[x(3), 17, -0.9]} rotation={[0, 0, 0.04]} />

      {/* Ink stamps from the reference sheets. */}
      <InkStamp name="phoenix" width={13} position={[0, 17.5, 0]} />
      <InkStamp name="lantern" width={8} position={[x(-33), 13, 0]} rotation={[0, 0, -0.05]} />
      <InkStamp name="inkEye" width={6} position={[x(-24), 17.5, 0]} rotation={[0, 0, 0.06]} />
      <InkStamp name="vine" width={5} position={[x(-35), 1, 0]} rotation={[0, 0, 0.04]} />
      <InkStamp name="vine" width={5} position={[x(35), -1, 0]} rotation={[0, 0, Math.PI + 0.05]} />
      <InkStamp name="swirl" width={16} position={[x(17), 1, 0.1]} opacity={0.55} />
      <InkStamp name="dragon" width={10} position={[x(27), 12, 0]} rotation={[0, 0, 0.06]} opacity={0.8} />
      <InkStamp name="grate" width={14} position={[x(-21), -14, 0]} rotation={[0, 0, 0.04]} />
      <InkStamp name="key" width={3.2} position={[x(30), -12, 0]} rotation={[0, 0, 0.5]} />
      <InkStamp name="keySmall" width={2} position={[x(-7), -16, 0]} rotation={[0, 0, -0.7]} />
      <InkStamp name="fleur" width={4.5} position={[x(13), -15, 0]} />

      {/* Photo scraps, taped on. */}
      <PhotoScrap name="eye" width={5.5} position={[x(-12), 14, 0.4]} rotation={[0, 0, -0.1]}>
        <Tape width={2.6} seed={1} position={[0, 4.4, 0]} rotation={[0, 0, 0.12]} />
      </PhotoScrap>
      <PhotoScrap name="loneTree" width={11} position={[x(15), 15, 0.3]} rotation={[0, 0, 0.07]}>
        <Tape width={3} seed={2} position={[-4.6, 3.5, 0]} rotation={[0, 0, 0.7]} />
        <Tape width={3} seed={3} position={[4.6, 3.5, 0]} rotation={[0, 0, -0.7]} />
      </PhotoScrap>
      <PhotoScrap name="trees" width={13} position={[x(6), -15, 0.3]} rotation={[0, 0, -0.05]}>
        <Tape width={3.2} seed={4} position={[0, 5.6, 0]} rotation={[0, 0, -0.04]} />
      </PhotoScrap>
      {/* Top corner: the title covers the middle band. */}
      <InkStamp name="jojo" width={7} opacity={0.85} position={[x(37), 12, 0.2]} rotation={[0, 0, -0.06]} />
      <Caption position={[x(-14.5), 9.6, 0.5]} rotation={[0, 0, -0.1]} size={0.55}>fig. 01</Caption>

      <Sparkles layout={WALL_SPARKLES} count={45} seed={3} size={[0.25, 1.3]} twinkle />
    </group>
  );
};

// City cut-outs drifting among the paper clouds on the zoom down to the door.
// They face the camera, so they read the same from any tilt, and sit above
// y≈-15 so they're behind the camera by the time it looks down at the door.
const DESCENT: { name: PhotoName; width: number; position: [number, number, number] }[] = [
  // Top to bottom: the tower sketch, the skyscrapers, then the bridge.
  // Kept below y≈-9 so none show from the hero.
  // The tower sketch is tall (height ≈ 2.5x width), so its centre sits low
  // enough that its top stays out of the hero. It stands just beside the door;
  // the skyscrapers and bridge are small and further out, so they read as
  // further away.
  { name: 'sketchTowers', width: 13, position: [-9.5, -24, 0] },
  { name: 'angelWings', width: 4.5, position: [6, -12, -8] },
  { name: 'petronas', width: 2.8, position: [15, -30, -6] },
  { name: 'bridge', width: 4.5, position: [16, -31, 5] },
];

const DescentStickers = () => {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((group, i) => {
      if (group) group.position.y = DESCENT[i].position[1] + Math.sin(clock.elapsedTime * 0.4 + i * 2) * 0.3;
    });
  });
  return (
    <>
      {DESCENT.map(({ name, width, position }, i) => (
        <group key={name} ref={(g) => { refs.current[i] = g; }} position={position}>
          <Billboard>
            <PhotoScrap name={name} width={width} rotation={[0, 0, i % 2 ? 0.06 : -0.05]}
              signature={name === 'angelWings' ? "w.c. '25" : undefined} />
          </Billboard>
        </group>
      ))}
    </>
  );
};

// The page seen from above around the door. Laid flat facing +y, so each
// piece's local +y reads as "up" on screen. The door sits at local (0, 1.5);
// from the first view of it the page shows roughly x ±39, y -16..20, and the
// camera then closes in on the middle, so the densest, sharpest pieces are there.
const DoorFloor = ({ spread }: { spread: number }) => {
  const x = (value: number) => value * spread;
  return (
    <group position={[0, -56, 8]} rotation={[-Math.PI / 2, 0, 0]} scale={1.5}>
      {/* Base sheets and strips. */}
      <PaperScrap width={26} height={22} seed={12} torn color={PAPER.kraft}
        position={[x(-17), 13, -1.2]} rotation={[0, 0, 0.06]} />
      <PaperScrap width={30} height={18} seed={13} torn color={PAPER.newsprint} pattern="halftone"
        position={[x(16), 22, -1.1]} rotation={[0, 0, -0.04]} />
      <PaperScrap width={16} height={22} seed={19} torn pattern="ruled" color={PAPER.white} margin
        position={[x(-31), -6, -1]} rotation={[0, 0, -0.05]}>
        {/* Ink drawings doodled over the ruled lines. */}
        <InkStamp name="phoenix" width={7.5} position={[1.6, 5.2, 0]} rotation={[0, 0, -0.32]} opacity={0.72} />
        <InkStamp name="inkEye" width={2.6} position={[-3.3, 0.6, 0]} rotation={[0, 0, 0.55]} opacity={0.9} />
        <InkStamp name="keySmall" width={2.2} position={[3.4, -1.8, 0]} rotation={[0, 0, 1.9]} opacity={0.6} />
        <InkStamp name="lantern" width={1.5} position={[-4.6, -4.2, 0]} rotation={[0, 0, 0.18]} opacity={0.95} />
        <InkStamp name="fleur" width={3.4} position={[0.2, -4.6, 0]} rotation={[0, 0, -0.42]} opacity={0.55} />
        <InkStamp name="key" width={1.1} position={[-1.2, -8.2, 0]} rotation={[0, 0, -0.9]} opacity={0.85} />
        <InkStamp name="swirl" width={5} position={[3.8, -7.8, 0]} rotation={[0, 0, 0.7]} opacity={0.4} />
      </PaperScrap>
      <PaperScrap width={14} height={17} seed={20} torn color={PAPER.charcoal}
        position={[x(32), -7, -1]} rotation={[0, 0, 0.07]}>
        <PhotoScrap name="starryManga" width={12.5} rotation={[0, 0, -0.05]}>
          <Tape width={3} seed={15} position={[-5.4, 4, 0]} rotation={[0, 0, 0.6]} />
        </PhotoScrap>
      </PaperScrap>
      <PaperScrap width={12} height={11} seed={21} torn color={PAPER.blue} pattern="halftone"
        position={[x(34), 15, -0.9]} rotation={[0, 0, 0.1]} />
      <PaperScrap width={120} height={3.2} seed={14} torn color={PAPER.jade} pattern="halftone"
        position={[0, 24, -0.6]} rotation={[0, 0, 0.12]} />
      <PaperScrap width={120} height={2.2} seed={15} torn color={PAPER.amber}
        position={[0, 7, -0.5]} rotation={[0, 0, -0.12]} />
      <PaperScrap width={120} height={2.6} seed={17} torn color={PAPER.magenta} pattern="halftone"
        position={[0, -17, -0.5]} rotation={[0, 0, 0.05]} />

      {/* Top band. */}
      <InkStamp name="lantern" width={8} position={[x(-33), 16, 0]} rotation={[0, 0, 0.04]} />
      <group position={[x(-19), 15, 0.3]} rotation={[0, 0, 0.07]}>
        <PhotoScrap name="filmPhone" width={7.5} rotation={[0, 0, 0.04]} />
      </group>
      <PhotoScrap name="grungeCollage" width={13} position={[x(0.5), 16, 0.2]} rotation={[0, 0, -0.03]}>
        <Tape width={3.2} seed={8} position={[-4.8, 8.2, 0]} rotation={[0, 0, 0.5]} />
      </PhotoScrap>
      <EditorialMarks width={14.4} height={18.6} label="REF_09 / GRAIN STUDY" position={[x(0.5), 16, 0.25]} rotation={[0, 0, -0.03]} />
      <PhotoScrap name="roseCross" width={10} position={[x(17), 14, 0.3]} rotation={[0, 0, 0.08]}>
        <Tape width={2.8} seed={9} position={[0, 5.7, 0]} rotation={[0, 0, -0.06]} />
      </PhotoScrap>
      <PhotoScrap name="filmPoster" width={8} position={[x(31), 15.5, 0.35]} rotation={[0, 0, -0.06]} />
      <InkStamp name="baroque" width={9} position={[x(39), 4, 0]} rotation={[0, 0, 0.12]} opacity={0.8} />

      {/* Film stills pasted into the page. */}
      <PhotoScrap name="filmSmoke" width={6.5} position={[x(-17), 8.6, 0.28]} rotation={[0, 0, -0.06]} />
      <PhotoScrap name="filmNeon" width={4.2} position={[x(27), 8, 0.28]} rotation={[0, 0, 0.07]} />
      <PhotoScrap name="filmAquarium" width={4.4} position={[x(15.5), -6.5, 0.4]} rotation={[0, 0, -0.08]}>
        <Tape width={1.8} seed={23} position={[0, 3.2, 0]} rotation={[0, 0, 0.1]} />
      </PhotoScrap>

      {/* Around the door. */}
      <InkStamp name="swirl" width={13} position={[0, 1, 0]} opacity={0.35} />
      <InkStamp name="vine" width={5} position={[x(-38), 0, 0]} />
      <InkStamp name="key" width={4} position={[x(5), 4, 0.1]} rotation={[0, 0, 0.5]} />
      <InkStamp name="keySmall" width={2.2} position={[x(-4.5), 3, 0.1]} rotation={[0, 0, -1]} />
      <InkStamp name="inkEye" width={7} position={[x(-12), 1.5, 0.05]} rotation={[0, 0, -0.08]} opacity={0.85} />
      <StarryNightTiles position={[x(11), 3.5, 0.5]} rotation={[0, 0, -0.08]} />
      <Caption position={[x(-9), 7.2, 0.5]} rotation={[0, 0, 0.06]} size={0.6}>fig. 02 — the door</Caption>
      <PhotoScrap name="gogglesCamera" width={6.5} position={[x(-24), 2, 0.3]} rotation={[0, 0, 0.07]} signature="w.c.">
        <Tape width={2.4} seed={22} position={[-2.6, 2.4, 0]} rotation={[0, 0, 0.7]} />
      </PhotoScrap>
      <PhotoScrap name="gogglesRadio" width={5.5} position={[x(22), 1, 0.3]} rotation={[0, 0, -0.07]} signature="w.c.">
        <Tape width={2.2} seed={11} position={[0, 2.9, 0]} rotation={[0, 0, 0.1]} />
      </PhotoScrap>
      <InkStamp name="fleur" width={3} position={[x(18.5), -3.5, 0.1]} />
      <RansomWord word="ENTER" cell={1.25} seed={41} position={[0, -3.4, 0.6]} rotation={[0, 0, 0.03]} />

      {/* Bottom band. */}
      <PaperScrap width={9} height={6.2} seed={18} torn pattern="ruled" color={PAPER.white} margin
        position={[x(-7), -10, 0.2]} rotation={[0, 0, 0.04]}>
        <Text font={TYPEWRITER_FONT} fontSize={0.5} color={PAPER.ink} anchorX="left" anchorY="top"
          position={[-2.2, 2.4, 0]} lineHeight={1.6} fillOpacity={0.85}>
          {'CONTENTS\n\n01 .... hello\n02 .... the door\n03 .... experience\n04 .... say hi'}
        </Text>
        <Tape width={2.2} seed={12} position={[-3.8, 3, 0]} rotation={[0, 0, 0.6]} />
      </PaperScrap>
      <PhotoScrap name="snowFigure" width={8} position={[x(7), -10, 0.3]} rotation={[0, 0, -0.05]} signature="w.c. '25">
        <Tape width={2.4} seed={13} position={[3.2, 2.4, 0]} rotation={[0, 0, -0.6]} />
      </PhotoScrap>
      <PhotoScrap name="filmNoodles" width={4.5} position={[x(-16.5), -9.5, 0.35]} rotation={[0, 0, 0.09]} />
      <PhotoScrap name="wkwTitle" width={5} position={[x(9), -3.8, 0.45]} rotation={[0, 0, 0.05]} />
      <PhotoScrap name="vagabond" width={7} position={[x(22), -11.5, 0.3]} rotation={[0, 0, -0.07]} signature="w.c.">
        <Tape width={2.4} seed={16} position={[0, 4.4, 0]} rotation={[0, 0, 0.05]} />
      </PhotoScrap>
      <PhotoScrap name="wkwFallen" width={5} position={[x(-28), -14, 0.4]} rotation={[0, 0, -0.08]} />
      <InkStamp name="blossom" width={10} position={[x(-15), -17, 0.1]} opacity={0.7} />
      <InkStamp name="grate" width={11} position={[x(34), -15, 0.1]} rotation={[0, 0, -0.05]} />
      <InkStamp name="key" width={3} position={[x(-36), -14, 0.1]} rotation={[0, 0, 1.2]} />

      <Sparkles layout={FLOOR_SPARKLES} count={45} seed={8} size={[0.3, 1.3]} twinkle />
    </group>
  );
};

// The desk under the experience polaroids. Only its edges show once the camera
// reaches the section, so everything hugs the sides. It floats well above the
// door floor, so it's pasted in only as the section arrives (in step with the
// EXPERIENCE letters) instead of covering the door on the way down.
const ExperienceBoard = ({ spread }: { spread: number }) => {
  const x = (value: number) => value * Math.max(spread, 0.7);
  const data = useScroll();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const target = data.range(0.8, 0.2) > 0 ? 1 : 0.001;
    const scale = THREE.MathUtils.damp(group.scale.x, target, 8, delta);
    group.scale.setScalar(scale);
    group.visible = scale > 0.01;
  });

  return (
    <group ref={groupRef} position={[0, -45, 15]} rotation={[-Math.PI / 2, 0, 0]} scale={0.001}>
      <PaperScrap width={34} height={15} seed={51} torn color={PAPER.kraft} position={[0, 0, -0.4]} />
      <PaperScrap width={11} height={14} seed={52} torn color={PAPER.newsprint} pattern="halftone"
        position={[x(-10.5), 0.3, -0.3]} rotation={[0, 0, -0.04]} />
      <PaperScrap width={10} height={13} seed={53} torn pattern="ruled" color={PAPER.white} margin
        position={[x(10.5), -0.4, -0.3]} rotation={[0, 0, 0.05]} />
      <PaperScrap width={36} height={1.4} seed={54} torn color={PAPER.red} pattern="halftone"
        position={[0, -5.9, -0.2]} rotation={[0, 0, 0.02]} />

      <PhotoScrap name="laptop" width={5.2} position={[x(-9.6), 3.4, 0.1]} rotation={[0, 0, 0.12]} />
      <EditorialMarks width={6.4} height={5.7} label="FIG_03 / THE DESK" position={[x(-9.6), 3.4, 0.12]} rotation={[0, 0, 0.12]} />
      {/* Blueprint turned on its side so the car runs across the desk. */}
      <PhotoScrap name="f1Blueprint" width={3} position={[x(-10), -2.1, 0.15]} rotation={[0, 0, Math.PI / 2 + 0.05]}>
        <Tape width={1.5} seed={14} position={[1.9, 1.2, 0]} rotation={[0, 0, -0.5]} />
      </PhotoScrap>
      <InkStamp name="key" width={2.4} position={[x(-6.3), -4.5, 0.1]} rotation={[0, 0, 1.2]} />
      <InkStamp name="fleur" width={1.6} position={[x(6.6), 5.6, 0.1]} rotation={[0, 0, -0.1]} />
      <PhotoScrap name="eightballCard" width={4.2} position={[x(9.8), 1.8, 0.2]} rotation={[0, 0, -0.22]} />
      <PhotoScrap name="tvStack" width={2.3} position={[x(11.8), -2.6, 0.25]} rotation={[0, 0, 0.12]} />
      <InkStamp name="filmFrame" width={5} position={[x(-14.4), -0.4, 0.05]} rotation={[0, 0, 1.5]} opacity={0.7} />
      <PhotoScrap name="neighborhood" width={3.3} position={[x(14.3), 0.3, 0.05]} rotation={[0, 0, -0.05]} />
    </group>
  );
};

// Replaces the starfield in the collage skin.
const CollageBackdrop = () => {
  const aspect = useThree((s) => s.size.width / s.size.height);
  // Pull pieces towards the middle on narrow screens so phones see more than
  // the gaps between them. Overlap is fine; it's a collage.
  const spread = Math.min(1, Math.max(0.42, aspect / 1.78));
  return (
    <>
      <HeroWall spread={spread} />
      <DescentStickers />
      <DoorFloor spread={spread} />
      <ExperienceBoard spread={spread} />
    </>
  );
};

export default CollageBackdrop;
