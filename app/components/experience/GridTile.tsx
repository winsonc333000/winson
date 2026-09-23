
import { Edges, MeshPortalMaterial, Text, TextProps, useScroll } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { usePortalStore } from '@stores';
import gsap from "gsap";
import { useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import * as THREE from 'three';
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

// TODO: Rename this
const GridTile = (props: GridTileProps) => {
  const titleRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Group>(null);
  const hoverBoxRef = useRef<THREE.Mesh>(null);
  const portalRef = useRef(null);
  const { title, textAlign, children, color, position, id } = props;
  const { camera } = useThree();
  const setActivePortal = usePortalStore((state) => state.setActivePortal);
  const isActive = usePortalStore((state) => state.activePortalId === id);
  const activePortalId = usePortalStore((state) => state.activePortalId);
  const data = useScroll();

  useEffect(() => {
    // Hanlde the hover box and title animation for mobile.
    if (isMobile && titleRef.current) {
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
  }, []);

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
    if (isMobile && titleRef.current) {
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

    const isWork = id === 'work';
    const points = isWork ?
      [[-1, 2, 0], [-1, -2, 0], [3, -2, 0]] :
      [[-3, 2, 0], [1, -2, 0], [1, 2, 0]];

    return <primitive object={TriangleGeometry({ points })} attach="geometry" />
  };

  return (
    <mesh ref={gridRef}
      position={position}
      onClick={portalInto}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}>
      { getGeometry() }
      <group>
        <mesh position={[0, 0, -0.01]} ref={hoverBoxRef} scale={[0, 0, 0]}>
          <boxGeometry args={[4, 4, 0.5]}/>
          <meshPhysicalMaterial
            color="#444"
            transparent={true}
            opacity={0.3}
          />
          <Edges color="white" lineWidth={3}/>
        </mesh>
        <Text position={[0, -1.8, 0.4]} {...fontProps} ref={titleRef}>
          {title}
        </Text>
      </group>
      {!activePortalId && <Edges color="white" lineWidth={2} depthTest={false} renderOrder={1} />}
      <MeshPortalMaterial ref={portalRef} blend={0} resolution={0} blur={0}>
        <color attach="background" args={[color]} />
        {children}
        <WarmUp />
      </MeshPortalMaterial>
    </mesh>
  );
}

export default GridTile;