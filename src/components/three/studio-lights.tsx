"use client";

import { Environment, Lightformer } from "@react-three/drei";

/** Luz principal branca vindo de cima e de frente; marca o chanfro de cima do objeto. */
export function KeyLight({ intensity = 1 }: { intensity?: number }) {
  return <directionalLight position={[0.5, 5, 3]} intensity={2.4 * intensity} color="#F2F2F2" />;
}

/** Luz de contorno roxa por trás do objeto; acende o chanfro nas laterais. */
export function RimLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <pointLight position={[-3, 1, -3]} color="#5749A5" intensity={90 * intensity} />
      <pointLight position={[3, -1, -3]} color="#5749A5" intensity={60 * intensity} />
      <pointLight position={[0, 3, -2.5]} color="#A89CF0" intensity={30 * intensity} />
    </>
  );
}

/** Reflexos locais com Lightformers, sem HDRI externo. Renderiza o cubemap uma vez só. */
export function StudioEnvironment() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={5} color="#F2F2F2" position={[0, 4, 2]} scale={[6, 1, 1]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={4} color="#A89CF0" position={[-4, 0, 1]} scale={[1, 4, 1]} rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={4} color="#5749A5" position={[4, 0, 1]} scale={[1, 4, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer form="ring" intensity={2} color="#F2F2F2" position={[0, 0, 5]} scale={3} />
    </Environment>
  );
}
