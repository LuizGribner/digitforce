"use client";

import { useLoader, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader, type SVGResult } from "three/examples/jsm/loaders/SVGLoader.js";

// Só o SVGLoader usa esta URL. Texturas do mesmo arquivo usam outra URL (ex.: "?as=texture"): o cache do useLoader
// não distingue SVGLoader de TextureLoader (ver hero-globe.tsx, ChipDecal).
const LOGO_URL = "/assets/logo/df-monogram-branco.svg";
// O SVG tem ~680 unidades de largura; com scale 1 o "df" fica com ~3.4 unidades na cena
const SVG_SCALE = 0.005;

// Uma geometria só para a página inteira, reaproveitada por todos os Views
const geometryCache = new WeakMap<SVGResult, THREE.ExtrudeGeometry>();

function getGeometry(svg: SVGResult) {
  let geo = geometryCache.get(svg);
  if (geo) return geo;

  // Ignora o clipPath herdado do Illustrator: só os paths brancos formam o logo
  const shapes = svg.paths
    .filter((path) => (path.userData?.style as { fill?: string } | undefined)?.fill?.toUpperCase() === "#FFFFFF")
    .flatMap((path) => SVGLoader.createShapes(path));

  geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 60,
    curveSegments: 48,
    bevelEnabled: true,
    bevelThickness: 8,
    bevelSize: 5,
    bevelSegments: 10,
  });
  geo.center();
  geometryCache.set(svg, geo);
  return geo;
}

// Manual da marca: monograma branco ou roxo sobre o navy
const VARIANTS = {
  // Lavanda perolada, quase branca; o sheen roxo dá o brilho de pérola nas bordas
  perola: {
    color: "#E6E1FF",
    metalness: 0.25,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    sheen: 1,
    sheenColor: "#A89CF0",
    sheenRoughness: 0.35,
    envMapIntensity: 1.4,
  },
  // Roxo da marca com leve emissive para não escurecer
  roxo: {
    color: "#5749A5",
    emissive: "#2A2380",
    emissiveIntensity: 0.5,
    metalness: 0.3,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    sheen: 0.6,
    sheenColor: "#A89CF0",
    sheenRoughness: 0.4,
    envMapIntensity: 1.2,
  },
} satisfies Record<string, ThreeElements["meshPhysicalMaterial"]>;

export type DfMarkVariant = keyof typeof VARIANTS;

type DfMarkProps = Omit<ThreeElements["mesh"], "geometry" | "scale" | "material"> & {
  scale?: number;
  variant?: DfMarkVariant;
  /** Sobrescreve props do material da variante. */
  material?: ThreeElements["meshPhysicalMaterial"];
};

export function DfMark({ scale = 1, variant = "perola", material, ...props }: DfMarkProps) {
  const svg = useLoader(SVGLoader, LOGO_URL);
  const geometry = getGeometry(svg);
  const s = SVG_SCALE * scale;

  return (
    // Y negativo: o SVG tem o eixo Y invertido em relação ao three
    <mesh geometry={geometry} scale={[s, -s, s]} {...props}>
      <meshPhysicalMaterial {...VARIANTS[variant]} {...material} />
    </mesh>
  );
}
