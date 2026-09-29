"use client";

import { Suspense, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import * as THREE from "three";

import { DfMark } from "./df-mark";
import { KeyLight, RimLights, StudioEnvironment } from "./studio-lights";

const RING_RADIUS = 1.9;

function Scene({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const mark = useRef<THREE.Group>(null);
  const segment = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (segment.current) segment.current.rotation.z -= delta * 0.25;

    const section = sectionRef.current;
    if (!mark.current || !section) return;
    // 0 quando a seção entra por baixo da tela, 1 quando sai por cima
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = THREE.MathUtils.clamp((vh - rect.top) / (vh + rect.height), 0, 1);
    // ±25° no máximo ao longo da seção: o "df" gira com o scroll mas nunca aparece espelhado
    const target = (progress - 0.5) * 2 * THREE.MathUtils.degToRad(25);
    mark.current.rotation.y = THREE.MathUtils.lerp(mark.current.rotation.y, target, 0.08);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7.5]} fov={35} />
      <ambientLight intensity={0.2} />
      <KeyLight />
      <RimLights />

      <group rotation-x={0.12}>
        {/* Arco principal com gap (referência Gems) */}
        <mesh rotation-z={Math.PI / 2}>
          <torusGeometry args={[RING_RADIUS, 0.025, 24, 220, Math.PI * 2 * 0.82]} />
          <meshStandardMaterial color="#5749A5" emissive="#5749A5" emissiveIntensity={0.35} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Segmento claro girando devagar em volta */}
        <group ref={segment}>
          <mesh position-z={0.01}>
            <torusGeometry args={[RING_RADIUS, 0.035, 24, 80, 0.7]} />
            <meshStandardMaterial color="#A89CF0" emissive="#A89CF0" emissiveIntensity={0.9} roughness={0.25} />
          </mesh>
        </group>
      </group>

      <group ref={mark}>
        <DfMark scale={0.55} />
      </group>

      <StudioEnvironment />
    </>
  );
}

export default function ManifestoRing({
  className,
  sectionRef,
}: {
  className?: string;
  sectionRef: RefObject<HTMLElement | null>;
}) {
  return (
    <View className={className}>
      <Suspense fallback={null}>
        <Scene sectionRef={sectionRef} />
      </Suspense>
    </View>
  );
}
