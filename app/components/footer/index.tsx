import { Svg, Text, useCursor, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import { useIsCollage } from "@stores";
import { FOOTER_LINKS } from "../../constants";
import { FooterLink } from "../../types";
import { PAPER } from "../collage/constants";
import LabelText from "../collage/LabelText";

const FooterLinkItem = ({ link, index }: { link: FooterLink; index: number }) => {
  const textRef = useRef<THREE.Mesh>(null);
  const collage = useIsCollage();
  const [hovered, setHovered] = useState(false);
  const onPointerOver = () => setHovered(true);
  const onPointerOut = () => setHovered(false);
  const onClick = () => window.open(link.url, '_blank');
  const onPointerMove = (e: MouseEvent) => {
    if (isMobile) return;
    const hoverDiv = document.getElementById(`footer-link-${link.name}`);
    gsap.to(hoverDiv, {
      top: `${e.clientY + 14}px`,
      left: `${e.clientX}px`,
      duration: 0.6,
    });
  };

  const fontProps = {
    font: "./Vercetti-Regular.woff",
    fontSize: 0.2,
    color: 'white',
    onPointerOver,
    onPointerMove,
    onPointerOut,
    onClick,
  };

  useEffect(() => {
    if (!document.getElementById(`footer-link-${link.name}`)) {
      const hoverDiv = document.createElement('div');
      hoverDiv.id = `footer-link-${link.name}`;
      hoverDiv.textContent = link.hoverText ?? link.name.toUpperCase();
      hoverDiv.style.position = 'fixed';
      hoverDiv.style.zIndex = '2';
      hoverDiv.style.bottom = '0';
      hoverDiv.style.opacity = '0';
      hoverDiv.style.left = window.innerWidth / 2 + 'px';
      hoverDiv.style.fontSize = '0.8rem';
      hoverDiv.style.pointerEvents = 'none';
      document.body.appendChild(hoverDiv);
    }
  }, [])

  useEffect(() => {
    if (isMobile) return

    const hoverDiv = document.getElementById(`footer-link-${link.name}`);

    if (hovered) {
      gsap.fromTo(hoverDiv, { opacity: 0 }, { opacity: 0.5, delay: 0.2 });
    } else {
      gsap.to(hoverDiv, { opacity: 0 });
    }

    gsap.to(textRef.current, {
      letterSpacing: hovered ? 0.3 : 0,
      duration: 0.3,
    });

    return () => {
      gsap.killTweensOf(hoverDiv);
      gsap.killTweensOf(textRef.current);
    }
  }, [hovered]);

  useCursor(hovered);

  if (isMobile) {
    // The icons are drawn white; ink them on the collage's paper.
    return <Svg onClick={onClick} scale={0.0015} position={[0.1, 0.25, 0]} src={link.icon}
      fillMaterial={collage ? { color: PAPER.ink } : undefined} />;
  }

  if (collage) {
    // Punched out on label-maker tape.
    return (
      <LabelText ref={textRef} {...fontProps} tape={index % 2 ? PAPER.red : PAPER.ink} seed={index + 7}
        rotation={[0, 0, index % 2 ? 0.04 : -0.03]}>
        {link.name.toUpperCase()}
      </LabelText>
    );
  }

  return (
    <Text ref={textRef} {...fontProps} >
      {link.name.toUpperCase()}
    </Text>
  )
}

const Footer = () => {
  const groupRef = useRef<THREE.Group>(null);
  const data = useScroll();

  useFrame(() => {
    const d = data.range(0.8, 0.2);
    if (groupRef.current) {
      groupRef.current.visible = d > 0;
    }
  });

  const spacing = isMobile ? 1.1 : 2;
  const offset = -((FOOTER_LINKS.length - 1) * spacing) / 2;

  const getLinks = () => {
    return FOOTER_LINKS.map((link, i) => {
      return (
        <group key={i} position={[i * spacing, 0, 0]}>
          <FooterLinkItem link={link} index={i}/>
        </group>
      );
    });
  };

  return (
    <group position={[0, -44, 18]} rotation={[-Math.PI / 2, 0, 0]} ref={groupRef}>
      <group position={[offset, 0, 0]}>
        { getLinks() }
      </group>
    </group>
  );
};

export default Footer;