import { useTexture } from "@react-three/drei";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import ProjectTile from "./ProjectTile";

import { PROJECTS } from "@constants";
import { usePortalStore } from "@stores";

// Preload all project images so textures are ready before first hover
PROJECTS.forEach(p => { if (p.image) useTexture.preload(p.image); });

const ProjectsCarousel = () => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const isActive = usePortalStore((state) => state.activePortalId === "projects");

  useEffect(() => {
    if (!isActive) setActiveId(null);
  }, [isActive]);

  const onClick = (id: number) => {
    if (!isMobile) return;
    setActiveId(id === activeId ? null : id);
  };

  const onHoverEnter = (id: number) => {
    if (isMobile) return;
    setActiveId(id);
  };

  const onHoverLeave = (id: number) => {
    if (isMobile) return;
    // Only clear if this card is still the active one — prevents a race where
    // pointerout fires after the next card's pointerover and wipes the new activeId.
    setActiveId(prev => prev === id ? null : prev);
  };

  const fov = Math.PI;
  const distance = 13;
  const count = PROJECTS.length;

  return (
    <group rotation={[0, -Math.PI / 12, 0]}>
      {PROJECTS.map((project, i) => {
        const angle = (fov / count) * i;
        const z = -distance * Math.sin(angle);
        const x = -distance * Math.cos(angle);
        const rotY = Math.PI / 2 - angle;

        return (
          <ProjectTile
            key={i}
            project={project}
            index={i}
            position={[x, 1, z]}
            rotation={[0, rotY, 0]}
            activeId={activeId}
            onClick={() => onClick(i)}
            onHoverEnter={() => onHoverEnter(i)}
            onHoverLeave={() => onHoverLeave(i)}
          />
        );
      })}
    </group>
  );
};

export default ProjectsCarousel;
