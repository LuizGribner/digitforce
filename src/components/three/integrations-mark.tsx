"use client";

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import * as THREE from "three";

import { orbitState } from "@/components/sections/orbit-state";
import { DfMark } from "./df-mark";
import { KeyLight, RimLights, StudioEnvironment } from "./studio-lights";

// Oscilação máxima em Y: nunca passa de ±20°, então o "df" nunca aparece espelhado
const MAX_YAW = THREE.MathUtils.degToRad(20);

function Scene() {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    // Na pilha fica invisível; surge (escala 0.6 -> 1 e fade) com a órbita mais de 60% aberta
    const r = orbitState.reveal;
    group.current.visible = r > 0.001;
    group.current.scale.setScalar(0.6 + 0.4 * r);
    group.current.rotation.y = MAX_YAW * Math.sin(state.clock.elapsedTime * 0.55);
    const material = mesh.current?.material as THREE.MeshPhysicalMaterial | undefined;
    if (material) {
      material.opacity = r;
      material.emissiveIntensity = orbitState.flash * 1.4;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={35} />
      <ambientLight intensity={0.2} />
      <KeyLight />
      <RimLights />
      <group ref={group} scale={0.6} visible={false}>
        <DfMark ref={mesh} scale={0.95} material={{ emissive: "#7C6FD6", emissiveIntensity: 0, transparent: true, opacity: 0 }} />
      </group>
      <StudioEnvironment />
    </>
  );
}

/** "df" perolado no centro da órbita de integrações, atrás do texto. */
export default function IntegrationsMark({ className }: { className?: string }) {
  return (
    <View className={className}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </View>
  );
}
