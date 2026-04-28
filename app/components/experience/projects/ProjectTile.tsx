import { Edges, Text, TextProps, useTexture } from "@react-three/drei";
import { ThreeEvent, useThree } from "@react-three/fiber";
import gsap from "gsap";
import React, { Suspense, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

import { PROJECTS } from "@constants";
import { usePortalStore } from "@stores";
import { Project } from "@types";

interface ProjectTileProps {
  project: Project;
  index: number;
  position: [number, number, number];
  rotation: [number, number, number];
  activeId: number | null;
  onClick: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}

const ProjectImage = React.forwardRef<THREE.Mesh, { src: string }>(({ src }, ref) => {
  const texture = useTexture(src);
  const { gl } = useThree();

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
  }, [texture, gl]);

  return (
    <mesh ref={ref} position={[0, 1, 0.02]} scale={[1, 0, 1]}>
      <planeGeometry args={[4.2, 4, 1]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
});
ProjectImage.displayName = "ProjectImage";

const ProjectTile = ({ project, index, position, rotation, activeId, onClick, onHoverEnter, onHoverLeave }: ProjectTileProps) => {
  const projectRef = useRef<THREE.Group>(null);
  const hoverAnimRef = useRef<gsap.core.Timeline | null>(null);
  const hovered = activeId === index;
  const isProjectSectionActive = usePortalStore((state) => state.activePortalId === "projects");

  // Named refs — no longer relies on children index ordering
  const bgMeshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<any>(null);
  const titleRef = useRef<any>(null);
  const dateGroupRef = useRef<THREE.Group>(null);
  const textBoxRef = useRef<any>(null); // Text (drei) or THREE.Mesh (image)
  const buttonRef = useRef<THREE.Group>(null);
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;

  // Callback ref: if image mesh mounts while already hovered, animate it in immediately
  const imageCallbackRef = React.useCallback((node: THREE.Mesh | null) => {
    textBoxRef.current = node;
    if (node && hoveredRef.current) {
      gsap.to(node.scale, { y: 1, duration: 0.5 });
    }
  }, []);

  const titleProps = useMemo(() => ({
    font: "./soria-font.ttf",
    color: "black",
  }), []);

  const subtitleProps: Partial<TextProps> = useMemo(() => ({
    font: "./Vercetti-Regular.woff",
    color: "black",
    anchorX: "left",
    anchorY: "top",
  }), []);

  useEffect(() => {
    if (!projectRef.current || !bgMeshRef.current || !titleRef.current || !dateGroupRef.current) return;
    hoverAnimRef.current?.kill();

    hoverAnimRef.current = gsap.timeline();

    if (project.image) {
      // Image tile: expand card, show image filling the whole box, hide all text
      hoverAnimRef.current
        .to(projectRef.current.position, { z: hovered ? 1 : 0, duration: 0.2 }, 0)
        .to(projectRef.current.position, { y: hovered ? 0.4 : 0 }, 0)
        .to(projectRef.current.scale, {
          x: hovered ? 1.3 : 1,
          y: hovered ? 1.3 : 1,
          z: hovered ? 1.3 : 1,
        }, 0)
        .to(bgMeshRef.current.scale, { y: hovered ? 2 : 1 }, 0)
        .to((bgMeshRef.current as THREE.Mesh).material, { opacity: hovered ? 0 : 0.3 }, 0)
        .to(bgMeshRef.current.position, { y: hovered ? 1 : 0 }, 0)
        // Hide title and date on hover
        .to(titleRef.current.scale, { x: hovered ? 0 : 1, y: hovered ? 0 : 1, duration: 0.2 }, 0)
        .to(dateGroupRef.current.scale, { x: hovered ? 0 : 1, y: hovered ? 0 : 1, duration: 0.2 }, 0);

      if (edgesRef.current) {
        const color = edgesRef.current.material.color;
        hoverAnimRef.current.to(color, { r: hovered ? 1 : 0, g: hovered ? 1 : 0, b: hovered ? 1 : 0, duration: 0.3 }, 0);
      }

      if (textBoxRef.current) {
        hoverAnimRef.current
          .to(textBoxRef.current.scale, { y: hovered ? 1 : 0, duration: 0.5 }, 0);
      }
    } else {
      // Text tile: original behaviour
      hoverAnimRef.current
        .to(projectRef.current.position, { z: hovered ? 1 : 0, duration: 0.2 }, 0)
        .to(projectRef.current.position, { y: hovered ? 0.4 : 0 }, 0)
        .to(projectRef.current.scale, {
          x: hovered ? 1.3 : 1,
          y: hovered ? 1.3 : 1,
          z: hovered ? 1.3 : 1,
        }, 0)
        .to(titleRef.current.position, { y: hovered ? 0.7 : -0.8 }, 0)
        .to(dateGroupRef.current.position, { y: hovered ? 2.6 : 1.4 }, 0)
        .to(bgMeshRef.current.scale, { y: hovered ? 2 : 1 }, 0)
        .to((bgMeshRef.current as THREE.Mesh).material, { opacity: hovered ? 0.95 : 0.3 }, 0)
        .to(bgMeshRef.current.position, { y: hovered ? 1 : 0 }, 0);

      if (textBoxRef.current) {
        hoverAnimRef.current
          .to(textBoxRef.current.position, { y: hovered ? 0.7 : 0 }, 0)
          .to(textBoxRef.current, { fillOpacity: hovered ? 1 : 0, duration: 0.4 }, 0);
      }

      if (project.url && buttonRef.current) {
        hoverAnimRef.current
          .to(buttonRef.current.scale, { y: hovered ? 1 : 0, x: hovered ? 1 : 0 }, 0)
          .to(buttonRef.current.position, { z: hovered ? 0.3 : -1 }, 0);
      }
    }
  }, [hovered]);

  useEffect(() => {
    if (projectRef.current) {
      gsap.to(projectRef.current.position, {
        y: isProjectSectionActive ? 0 : -10,
        duration: 1,
        delay: isProjectSectionActive ? index * 0.1 : 0,
      });
    }
  }, [isProjectSectionActive]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!project.url) return;
    const button = e.eventObject;
    gsap.to(button.position, { z: 0, duration: 0.1 })
      .then(() => gsap.to(button.position, { z: 0.3, duration: 0.3 }));
    setTimeout(() => window.open(project.url, '_blank'), 50);
  };

  const openLightbox = () => {
    if (!project.image) return;

    const imageProjects = PROJECTS.filter(p => p.image);
    let currentIdx = imageProjects.findIndex(p => p.image === project.image);

    // Preload all images as DOM Image objects so navigation is instant
    const domImages: HTMLImageElement[] = imageProjects.map(p => {
      const el = new Image();
      el.src = p.image!;
      return el;
    });

    // --- overlay ---
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0);display:flex;
      align-items:center;justify-content:center;z-index:1000;
    `;

    const img = document.createElement('img');
    img.src = imageProjects[currentIdx].image!;
    img.style.cssText = `
      max-width:82vw;max-height:88vh;object-fit:contain;
      border-radius:4px;opacity:0;transform:scale(0.9);pointer-events:none;
    `;

    // --- close button ---
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      position:fixed;top:20px;right:24px;background:none;border:none;
      color:#fff;font-size:48px;line-height:1;cursor:pointer;opacity:0;
      font-family:sans-serif;z-index:1002;padding:0;
    `;

    const arrowStyle = `
      position:fixed;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.1);
      border:1px solid rgba(255,255,255,0.3);color:#fff;font-size:28px;line-height:1;
      cursor:pointer;opacity:0;z-index:1002;padding:12px 18px;border-radius:4px;
      font-family:sans-serif;transition:background 0.2s;
    `;

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&#8592;';
    prevBtn.style.cssText = arrowStyle + 'left:24px;';

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&#8594;';
    nextBtn.style.cssText = arrowStyle + 'right:24px;';

    overlay.appendChild(img);
    document.body.appendChild(overlay);
    document.body.appendChild(closeBtn);
    document.body.appendChild(prevBtn);
    document.body.appendChild(nextBtn);

    const updateArrowVisibility = () => {
      prevBtn.style.display = currentIdx === 0 ? 'none' : 'block';
      nextBtn.style.display = currentIdx === imageProjects.length - 1 ? 'none' : 'block';
    };
    updateArrowVisibility();

    // animate in
    gsap.to(overlay, { background: 'rgba(0,0,0,0.92)', duration: 0.3 });
    gsap.to(img, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
    gsap.to([closeBtn, prevBtn, nextBtn], { opacity: 1, duration: 0.3, delay: 0.15 });

    const navigate = (dir: number) => {
      const next = currentIdx + dir;
      if (next < 0 || next >= imageProjects.length) return;
      gsap.to(img, {
        opacity: 0, x: dir * -40, duration: 0.2,
        onComplete: () => {
          currentIdx = next;
          const show = () => {
            img.src = imageProjects[currentIdx].image!;
            gsap.fromTo(img, { opacity: 0, x: dir * 40 }, { opacity: 1, x: 0, duration: 0.25 });
            updateArrowVisibility();
          };
          const preloaded = domImages[currentIdx];
          if (preloaded.complete) {
            show();
          } else {
            preloaded.onload = show;
            preloaded.onerror = show;
          }
        },
      });
    };

    const close = () => {
      gsap.to(img, { opacity: 0, scale: 0.9, duration: 0.25 });
      gsap.to([closeBtn, prevBtn, nextBtn], { opacity: 0, duration: 0.2 });
      gsap.to(overlay, {
        background: 'rgba(0,0,0,0)', duration: 0.3,
        onComplete: () => { overlay.remove(); closeBtn.remove(); prevBtn.remove(); nextBtn.remove(); },
      });
    };

    let keyHandler: (e: KeyboardEvent) => void;
    const originalClose = close;
    const closeAndCleanup = () => {
      document.removeEventListener('keydown', keyHandler, { capture: true });
      originalClose();
    };
    keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        closeAndCleanup();
      }
    };
    document.addEventListener('keydown', keyHandler, { capture: true });

    prevBtn.onclick = (e) => { e.stopPropagation(); navigate(-1); };
    nextBtn.onclick = (e) => { e.stopPropagation(); navigate(1); };
    closeBtn.onclick = (e) => { e.stopPropagation(); closeAndCleanup(); };
    overlay.onclick = closeAndCleanup;
  };

  const handleCardClick = (e: ThreeEvent<MouseEvent>) => {
    if (hovered && project.image) {
      e.stopPropagation();
      openLightbox();
      return;
    }
    onClick();
  };

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={handleCardClick}
      onPointerOver={() => isProjectSectionActive && onHoverEnter()}
      onPointerOut={() => isProjectSectionActive && onHoverLeave()}>
      <group ref={projectRef}>
        <mesh ref={bgMeshRef}>
          <planeGeometry args={[4.2, 2, 1]} />
          <meshBasicMaterial color="#FFF" transparent opacity={0.3}/>
          <Edges ref={edgesRef} color="black" lineWidth={1.5} />
        </mesh>
        <Text
          ref={titleRef}
          {...titleProps}
          position={[-1.9, -0.8, 0.101]}
          anchorX="left"
          anchorY="bottom"
          maxWidth={4}
          fontSize={0.8}>
          {project.title}
        </Text>
        <group ref={dateGroupRef} position={[-1.25, 1.4, 0.01]}>
          <mesh>
            <planeGeometry args={[1.7, 0.4, 1]} />
            <meshBasicMaterial color="#777" opacity={0} wireframe />
            <Edges color="black" lineWidth={1} />
          </mesh>
          <Text
            {...subtitleProps}
            position={[-0.7, 0.2, 0]}
            fontSize={0.3}>
            {project.date.toUpperCase()}
          </Text>
        </group>
        {project.image ? (
          <Suspense fallback={null}>
            <ProjectImage ref={imageCallbackRef} src={project.image} />
          </Suspense>
        ) : (
          <Text
            ref={textBoxRef}
            {...subtitleProps}
            maxWidth={3.8}
            position={[-1.9, 2.3, 0.1]}
            fontSize={0.2}>
            {project.subtext}
          </Text>
        )}
        {project.url && (
          <group
            ref={buttonRef}
            position={[1.3, -0.6, -1]}
            scale={[0, 0, 1]}
            onClick={handleClick}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}>
            <mesh>
              <boxGeometry args={[1.1, 0.4, 0.2]} />
              <meshBasicMaterial color="#222" />
              <Edges color="white" lineWidth={1} />
            </mesh>
            <Text
              {...subtitleProps}
              color="white"
              position={[-0.4, 0.15, 0.2]}
              fontSize={0.25}>
              VIEW ↗
            </Text>
          </group>
        )}
      </group>
    </group>
  );
};

export default ProjectTile;
