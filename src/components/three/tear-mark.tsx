"use client";

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import * as THREE from "three";

import { tearState } from "@/components/tear/tear-state";
import { DfMark } from "./df-mark";
import { KeyLight, RimLights, StudioEnvironment } from "./studio-lights";

const MAX_YAW = THREE.MathUtils.degToRad(25);

function Scene() {
  const mark = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!mark.current) return;
    // Giro guiado pelo scroll, de -25° até de frente: nunca passa de ±25°, então o "df" nunca aparece espelhado.
    // A escala 0.85 -> 1 é feita no container do View pela timeline (vale também para o fallback estático).
    const target = -MAX_YAW * (1 - tearState.reveal);
    mark.current.rotation.y = THREE.MathUtils.lerp(mark.current.rotation.y, target, 0.14);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={35} />
      <ambientLight intensity={0.2} />
      <KeyLight />
      <RimLights />
      <group ref={mark} rotation-y={-MAX_YAW * (1 - tearState.reveal)}>
        <DfMark scale={0.92} />
      </group>
      <StudioEnvironment />
    </>
  );
}

/** "df" 3D revelado pelo rasgo da seção #sobre. */
export default function TearMark({ className }: { className?: string }) {
  return (
    <View className={className}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </View>
  );
}
