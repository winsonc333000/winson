
import { Edges, MeshPortalMaterial, Text, TextProps, useScroll } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useIsCollage, usePortalStore } from '@stores';
import gsap from "gsap";
import { Suspense, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import * as THREE from 'three';
import { PENCIL_FONT, PAPER } from '../collage/constants';
import Decoration from '../collage/Decoration';
import { PaperScrap, Tape } from '../collage/PaperScrap';
import WarmUp from '../common/WarmUp';
import { TriangleGeometry } from './Triangle';

interface GridTileProps {
  id: string;
  title: string;
  textAlign: TextProps['textAlign'];
  children: React.ReactNode;
  color: string;
  position: THREE.Vector3;
}

const corner = new THREE.Vector3();

// On a phone the two polaroids stack down the tall screen at about half size,
// overlapping a little. The tiles themselves stay put, since each portal's
// world is placed from its tile: only the photo window and its frame shift,
// onto these centres relative to the tile. The scene inside is shrunk and
// moved to match while previewed, and grows back as the portal is entered.
const MOBILE_POLAROID_SCALE = 0.55;
const MOBILE_POLAROID_OFFSET: Record<string, [number, number]> = {
  work: [0.7, 1.07],
  projects: [-0.7, -1.27],
};
const mobilePhotoGeometry = new Map<string, THREE.BufferGeometry>();
const getMobilePhotoGeometry = (id: string) => {
  let geometry = mobilePhotoGeometry.get(id);
  if (!geometry) {
    const [x, y] = MOBILE_POLAROID_OFFSET[id] ?? [0, 0];
    const size = 4 * MOBILE_POLAROID_SCALE;
    geometry = new THREE.PlaneGeometry(size, size).translate(x, y, 0);
    mobilePhotoGeometry.set(id, geometry);
  }
  return geometry;
};

// TODO: Rename this
const GridTile = (props: GridTileProps) => {
  const titleRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Group>(null);
  const hoverBoxRef = useRef<THREE.Mesh>(null);
  const portalRef = useRef(null);
  const portalWorldRef = useRef<THREE.Group>(null);
  const { title, textAlign, children, color, position, id } = props;
  const { camera } = useThree();
  const setActivePortal = usePortalStore((state) => state.setActivePortal);
  const isActive = usePortalStore((state) => state.activePortalId === id);
  const activePortalId = usePortalStore((state) => state.activePortalId);
  const data = useScroll();
  const collage = useIsCollage();
  // In the collage skin the tiles become polaroids; the frames carry the titles.
  const polaroid = collage;
  const mobilePolaroid = polaroid && isMobile;
  const [frameX, frameY] = mobilePolaroid ? MOBILE_POLAROID_OFFSET[id] ?? [0, 0] : [0, 0];
  const previewScale = mobilePolaroid ? MOBILE_POLAROID_SCALE : 1;

  // Slides the portal's world between its preview framing and full size.
  const framePortalWorld = (entered: boolean, duration: number) => {
    const world = portalWorldRef.current;
    if (!world) return;
    gsap.to(world.position, { x: entered ? 0 : frameX, y: entered ? 0 : frameY, duration });
    gsap.to(world.scale, { x: entered ? 1 : previewScale, y: entered ? 1 : previewScale, z: entered ? 1 : previewScale, duration });
  };

  useEffect(() => {
    // Hanlde the hover box and title animation for mobile. Rerun on a skin
    // change: the site opens on the collage, whose polaroids skip this.
    if (isMobile && !polaroid && titleRef.current) {
      const isWork = id === 'work';
      gsap.to(titleRef.current, {
        fontSize: 0.13,
        maxWidth: 4,
        color: isWork ? '#FFF' : '#888',
        letterSpacing: 0.4,
      });
      gsap.to(titleRef.current.position, {
        x: isWork ? 1: -1,
        y: isWork ? -1.7 : 1.5,
        duration: 0.5,
      });
    }
  }, [polaroid]);

  // The portal renders its whole scene into a full-canvas render target every
  // frame, but its material only samples the pixels under this tile. Scissor
  // the render to the tile's on-screen rect so the rest isn't shaded for nothing.
  useFrame(({ camera }) => {
    // gridRef is typed as a Group but is attached to the tile mesh.
    const mesh = gridRef.current as unknown as THREE.Mesh | null;
    const target = (portalRef.current as { map?: THREE.Texture } | null)?.map?.renderTarget;
    if (!mesh || !target) return;

    const geometry = mesh.geometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
        .applyMatrix4(mesh.matrixWorld)
        .applyMatrix4(camera.matrixWorldInverse);
      // A corner behind the camera makes the projected rect meaningless.
      if (corner.z > -(camera as THREE.PerspectiveCamera).near) {
        target.scissorTest = false;
        return;
      }
      corner.applyMatrix4(camera.projectionMatrix);
      minX = Math.min(minX, corner.x); maxX = Math.max(maxX, corner.x);
      minY = Math.min(minY, corner.y); maxY = Math.max(maxY, corner.y);
    }

    // Pad so a frame of lag behind camera/hover movement never shows an edge.
    const pad = 32;
    const x = Math.max(0, Math.floor((minX * 0.5 + 0.5) * target.width) - pad);
    const y = Math.max(0, Math.floor((minY * 0.5 + 0.5) * target.height) - pad);
    const right = Math.min(target.width, Math.ceil((maxX * 0.5 + 0.5) * target.width) + pad);
    const top = Math.min(target.height, Math.ceil((maxY * 0.5 + 0.5) * target.height) + pad);
    target.scissor.set(x, y, Math.max(0, right - x), Math.max(0, top - y));
    target.scissorTest = true;
  });

  useFrame(() => {
    const d = data.range(0.95, 0.05);
    if (isMobile && !polaroid && titleRef.current) {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      (titleRef.current as any).fillOpacity = d;
    }
  });

  const handleEscape = useRef<(e: KeyboardEvent) => void>(null);
  // Always holds the latest exitPortal so close button / escape key don't
  // call a stale closure captured at portal-entry time.
  const exitPortalRef = useRef<(force?: boolean) => void>(null);

  const exitPortal = (force = false) => {
    if (!force && !activePortalId) return;
    // Call immediately so portal-specific useFrames (Work/Projects camera
    // manipulations) stop. ScrollWrapper then smoothly damps rotation and
    // position.y/z back via its own useFrame — no GSAP conflict.
    setActivePortal(null);

    // Only reset x: ScrollWrapper never touches position.x but Projects moves
    // it to 2. rotation and position.y/z are handled by ScrollWrapper.
    gsap.to(camera.position, { x: 0, duration: 1 });

    framePortalWorld(false, 1);
    gsap.to(portalRef.current, {
      blend: 0,
      duration: 1,
    });

    const closeEl = document.querySelector('.close');
    if (closeEl) {
      gsap.to(closeEl, {
        scale: 0,
        duration: 0.5,
        onComplete: () => {
          document.querySelectorAll('.close').forEach((el) => el.remove());
        }
      });
    }

    if (handleEscape.current) {
      document.body.removeEventListener('keydown', handleEscape.current);
      handleEscape.current = null;
    }
  };

  // Keep the ref in sync with the latest render's exitPortal.
  exitPortalRef.current = exitPortal;

  const portalInto = (e: React.MouseEvent) => {
    if (isActive || activePortalId) return;
    e.stopPropagation();
    setActivePortal(id);
    document.body.style.cursor = 'auto';
    const div = document.createElement('div');

    div.className = 'fixed close';
    div.style.transform = 'rotateX(90deg)';
    // Use the ref so the click always calls the current exitPortal.
    div.onclick = () => exitPortalRef.current?.(true);

    if (!document.querySelector('.close')) {
      document.body.appendChild(div);

      gsap.fromTo(div, {
        scale: 0,
        rotate: '-180deg',
      },{
        opacity: 1,
        zIndex: 10,
        transform: 'rotateX(0deg)',
        scale: 1,
        duration: 1,
      })
    }
    handleEscape.current = (e: KeyboardEvent) => { if (e.key === 'Escape') exitPortalRef.current?.(true); };
    document.body.addEventListener('keydown', handleEscape.current);
    framePortalWorld(true, 0.5);
    gsap.to(portalRef.current, {
      blend: 1,
      duration: 0.5,
    });
  };

  const fontProps: Partial<TextProps> = {
    font: "./soria-font.ttf",
    maxWidth: 2,
    anchorX: 'center',
    anchorY: 'bottom',
    fontSize: 0.7,
    color: 'white',
    textAlign: textAlign,
    fillOpacity: 0,
  };

  const onPointerOver = () => {
    if (isActive || isMobile) return;
    document.body.style.cursor = 'pointer';
    gsap.to(titleRef.current, {
      fillOpacity: 1
    });
    if (gridRef.current && hoverBoxRef.current) {
      gsap.to(gridRef.current.position, { z: 0.5, duration: 0.4});
      gsap.to(hoverBoxRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
    }
  };

  const onPointerOut = () => {
    if (isMobile) return;
    document.body.style.cursor = 'auto';
    gsap.to(titleRef.current, {
      fillOpacity: 0
    });
    if (gridRef.current && hoverBoxRef.current) {
      gsap.to(gridRef.current.position, { z: 0, duration: 0.4});
      gsap.to(hoverBoxRef.current.scale, { x: 0, y: 0, z: 0, duration: 0.4 });
    }
  };

  const getGeometry = () => {
    if (!isMobile) {
      return <planeGeometry args={[4, 4, 1]} />
    }

    if (mobilePolaroid) {
      return <primitive object={getMobilePhotoGeometry(id)} attach="geometry" />
    }

    const isWork = id === 'work';
    const points = isWork ?
      [[-1, 2, 0], [-1, -2, 0], [3, -2, 0]] :
      [[-3, 2, 0], [1, -2, 0], [1, 2, 0]];

    return <primitive object={TriangleGeometry({ points })} attach="geometry" />
  };

  return (
    <mesh ref={gridRef}
      position={position}
      // Shrunk a little so the two frames don't overlap. Tilting the tiles made
      // their photos cross at the seam and z-fight.
      scale={polaroid && !isMobile ? 0.9 : 1}
      onClick={portalInto}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}>
      { getGeometry() }
      <group position={[frameX, frameY, 0]} scale={mobilePolaroid ? MOBILE_POLAROID_SCALE : 1}>
        {polaroid ? (
          // The photo lifts on hover; this is its shadow left on the page below.
          <Decoration>
            <mesh position={[0.3, -0.6, -0.48]} ref={hoverBoxRef} scale={[0, 0, 0]}>
              <planeGeometry args={[4.5, 5.1]}/>
              <meshBasicMaterial color="#2a1e12" transparent opacity={0.28} depthWrite={false}/>
            </mesh>
          </Decoration>
        ) : (
          <mesh position={[0, 0, -0.01]} ref={hoverBoxRef} scale={[0, 0, 0]}>
            <boxGeometry args={[4, 4, 0.5]}/>
            <meshPhysicalMaterial
              color="#444"
              transparent={true}
              opacity={0.3}
            />
            <Edges color="white" lineWidth={3}/>
          </mesh>
        )}
        {/* Work is a polaroid; side projects sit on a torn black card with a
            chalk caption, so the two tiles aren't the same frame twice. */}
        {/* Only the photo itself is clickable; the frames are decoration. */}
        {polaroid && id === 'work' && (
          <Decoration>
          <PaperScrap width={4.5} height={5.1} seed={31} color={PAPER.white} position={[0, -0.33, -0.02]}>
            <Suspense fallback={null}>
              <Text font={PENCIL_FONT} fontSize={0.38} color={PAPER.ink} position={[0, -2.2, 0]}
                anchorX="center" anchorY="middle" rotation={[0, 0, -0.02]}>
                work &amp; education
              </Text>
            </Suspense>
            <Tape width={1.5} seed={2} position={[-1.9, 2.5, 0.03]} rotation={[0, 0, 0.75]} />
            <Tape width={1.5} seed={3} position={[1.9, 2.5, 0.03]} rotation={[0, 0, -0.75]} />
          </PaperScrap>
          </Decoration>
        )}
        {polaroid && id !== 'work' && (
          <Decoration>
          <PaperScrap width={4.7} height={5.2} seed={32} torn color={PAPER.charcoal} position={[0, -0.36, -0.05]}>
            <Suspense fallback={null}>
              <Text font={PENCIL_FONT} fontSize={0.38} color={PAPER.paper} position={[0, -2.25, 0]}
                anchorX="center" anchorY="middle" rotation={[0, 0, 0.03]}>
                side projects
              </Text>
            </Suspense>
            <Tape width={1.8} seed={5} position={[0, 2.62, 0.03]} rotation={[0, 0, 0.04]} />
          </PaperScrap>
          </Decoration>
        )}
        <Text position={[0, -1.8, 0.4]} {...fontProps} ref={titleRef}>
          {title}
        </Text>
      </group>
      {!activePortalId && !polaroid && <Edges color={collage ? PAPER.ink : "white"} lineWidth={2} depthTest={false} renderOrder={1} />}
      <MeshPortalMaterial ref={portalRef} blend={0} resolution={0} blur={0}>
        <color attach="background" args={[color]} />
        <group ref={portalWorldRef} position={[frameX, frameY, 0]} scale={previewScale}>
          {children}
        </group>
        <WarmUp />
      </MeshPortalMaterial>
    </mesh>
  );
}

export default GridTile;