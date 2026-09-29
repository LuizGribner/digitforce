"use client";

import { Suspense, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, RoundedBox, useTexture, View } from "@react-three/drei";
import * as THREE from "three";

import { getElementPointer } from "./pointer";
import { KeyLight, RimLights, StudioEnvironment } from "./studio-lights";

export type ProductKind = "interfones" | "elevadores" | "athpace";

const P = "/assets/produtos";

// Pose 3/4 de repouso; o mouse sobre o card soma uma rotação em cima disso
const BASE_ROTATION = { x: 0.1, y: -0.45 };

/** Foto frontal (PNG/WebP com fundo transparente) num plano colado na face da frente. */
function Photo({ url, width, height, z }: { url: string; width: number; height: number; z: number }) {
  const map = useTexture(url);
  return (
    <mesh position-z={z}>
      <planeGeometry args={[width, height]} />
      {/* Sem iluminação: a foto já tem luz própria e, sem tone mapping, estouraria sob a luz principal */}
      <meshBasicMaterial map={map} transparent />
    </mesh>
  );
}

// As caixas ocupam só a área do aparelho dentro da foto (a foto tem margem e partes salientes)

function Interfone() {
  // unidade-externa-frente.webp: 926x1600
  const w = 1.39;
  const h = 2.4;
  const depth = 0.4;
  return (
    <group>
      <RoundedBox args={[w * 0.907, h * 0.95, depth]} radius={0.04} smoothness={4} position={[-0.035, -0.045, -depth / 2]}>
        <meshPhysicalMaterial color="#e8e8ee" roughness={0.35} clearcoat={0.5} />
      </RoundedBox>
      {/* A foto lateral (unidade-externa-lateral.webp) tem perspectiva e o chapéu de chuva saliente, então
          não encaixa na lateral de uma caixa; as laterais ficam só com o material. */}
      <Suspense fallback={null}>
        <Photo url={`${P}/interfone/unidade-externa-frente.webp`} width={w} height={h} z={0.005} />
      </Suspense>
    </group>
  );
}

function Elevador() {
  // intercomunicador-cabine-a.webp: 1308x734
  const w = 2.6;
  const h = 1.46;
  const depth = 0.22;
  return (
    <group>
      <RoundedBox args={[w * 0.917, h * 0.98, depth]} radius={0.03} smoothness={4} position={[0.012, -0.006, -depth / 2]}>
        <meshPhysicalMaterial color="#e4e2dc" roughness={0.5} clearcoat={0.2} />
      </RoundedBox>
      <Suspense fallback={null}>
        <Photo url={`${P}/elevador/intercomunicador-cabine-a.webp`} width={w} height={h} z={0.005} />
      </Suspense>
    </group>
  );
}

function Athpace() {
  // Tablet de 8" (16:10) apoiado numa base inclinada, como nas fotos de ambiente
  // TODO: aplicar a foto do speaker/tablet Athpace como textura da tela quando ela chegar
  const w = 1.9;
  const h = 1.19;
  const depth = 0.07;
  return (
    <group position-y={0.15}>
      <group rotation-x={-0.28}>
        <RoundedBox args={[w, h, depth]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial color="#333333" metalness={0.7} roughness={0.35} clearcoat={0.6} />
        </RoundedBox>
        {/* Tela escura com brilho sutil */}
        <mesh position-z={depth / 2 + 0.002}>
          <planeGeometry args={[w - 0.12, h - 0.12]} />
          <meshPhysicalMaterial
            color="#05051a"
            emissive="#2a1f7a"
            emissiveIntensity={0.3}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
      </group>
      {/* Suporte traseiro inclinado e base */}
      <RoundedBox args={[0.9, 0.8, 0.08]} radius={0.03} smoothness={4} position={[0, -0.45, -0.35]} rotation-x={0.45}>
        <meshPhysicalMaterial color="#2a2a2e" metalness={0.6} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[1.3, 0.06, 0.85]} radius={0.03} smoothness={4} position={[0, -0.84, -0.2]}>
        <meshPhysicalMaterial color="#2a2a2e" metalness={0.6} roughness={0.4} />
      </RoundedBox>
    </group>
  );
}

const MODELS: Record<ProductKind, () => React.JSX.Element> = {
  interfones: Interfone,
  elevadores: Elevador,
  athpace: Athpace,
};

function Scene({ kind, hoverRef }: { kind: ProductKind; hoverRef: RefObject<HTMLElement | null> }) {
  const group = useRef<THREE.Group>(null);
  const Model = MODELS[kind];

  useFrame((state) => {
    if (!group.current) return;
    const hover = getElementPointer(state, hoverRef.current);
    const targetY = BASE_ROTATION.y + (hover ? hover.x * 0.4 : 0);
    const targetX = BASE_ROTATION.x + (hover ? -hover.y * 0.25 : 0);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.06);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.06);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={30} />
      <ambientLight intensity={0.35} />
      <KeyLight intensity={0.7} />
      <RimLights />

      {/* Levemente acima do centro para escapar da borda de cima do card (referência Profico) */}
      <group ref={group} position-y={0.2} rotation={[BASE_ROTATION.x, BASE_ROTATION.y, 0]}>
        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
          <Model />
        </Float>
      </group>

      <StudioEnvironment />
    </>
  );
}

export default function ProductModel({
  kind,
  className,
  hoverRef,
}: {
  kind: ProductKind;
  className?: string;
  hoverRef: RefObject<HTMLElement | null>;
}) {
  return (
    <View className={className}>
      <Scene kind={kind} hoverRef={hoverRef} />
    </View>
  );
}
