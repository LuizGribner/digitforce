"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { OrthographicCamera, RoundedBox, useTexture, View } from "@react-three/drei";
import * as THREE from "three";

import { TEX_H, TEX_W, drawCircuit, generateCircuit } from "@/components/hero-globe/circuit-texture";
import {
  STEP,
  clamp,
  createGlobe,
  createSurface,
  damp,
  stepGlobe,
  stepSurface,
  updateHeadings,
  type Globe as GlobeState,
  type Motion,
  type Surface,
} from "@/components/hero-globe/globe-motion";
import { getRenderQuality } from "@/components/hero-globe/render-quality";
import { StudioEnvironment } from "./studio-lights";

/** Estado controlado pelo DOM (hero.tsx) e lido a cada frame, sem re-render. */
export type GlobeSim = { auto: boolean; reduced: boolean; active: boolean };

const R = 2.25;
const UP = new THREE.Vector3(0, 1, 0);
// Topo visível do globo puxado um pouco para a câmera: o chip fica no alto, com o topo (e o "df") à mostra
const DESIRED_UP = new THREE.Vector3(0, 1, 0.45).normalize();
const TRAIL_N = 24;
const TRAIL_LIFE = 1.6;

type Trail = {
  pos: THREE.Vector3[];
  strength: number[];
  born: number[];
  head: number;
  lastPush: number;
};

// --- globo ------------------------------------------------------------------------------------------------

function useCircuitTextures() {
  const textures = useMemo(() => {
    const prims = generateCircuit();
    // Celular/fraco: textura em meia resolução (1/4 dos pixels para gerar e para a memória da GPU)
    const low = getRenderQuality() === "low";
    const scale = low ? 0.5 : 1;
    const make = () => {
      const c = document.createElement("canvas");
      c.width = TEX_W * scale;
      c.height = TEX_H * scale;
      return c;
    };
    const base = make();
    const emissive = make();
    drawCircuit(base.getContext("2d")!, emissive.getContext("2d")!, prims, 7, scale);
    const toTexture = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = low ? 4 : 8;
      t.wrapS = THREE.RepeatWrapping;
      return t;
    };
    return { map: toTexture(base), emissiveMap: toTexture(emissive) };
  }, []);

  useEffect(
    () => () => {
      textures.map.dispose();
      textures.emissiveMap.dispose();
    },
    [textures],
  );
  return textures;
}

function createTrail(): Trail {
  return {
    pos: Array.from({ length: TRAIL_N }, () => new THREE.Vector3(0, 1, 0)),
    strength: new Array(TRAIL_N).fill(0),
    born: new Array(TRAIL_N).fill(-10),
    head: 0,
    lastPush: -10,
  };
}

/** Rastro + uniforms do shader apontando para os mesmos arrays (mutados no useFrame, lidos pela GPU). */
function createTrailState() {
  const trail = createTrail();
  const uniforms = {
    uTrailPos: { value: trail.pos },
    uTrailStr: { value: trail.strength },
    uTrailSharp: { value: 150 },
    uTrailColor: { value: new THREE.Color("#C9C0FF").multiplyScalar(2.2) },
  };
  return { trail, uniforms };
}

function Globe({ motion, surface }: { motion: RefObject<Motion>; surface: RefObject<Surface> }) {
  const { map, emissiveMap } = useCircuitTextures();
  const trailState = useRef(createTrailState());

  // Grava a posição do chip (local do globo) enquanto ele anda; cada ponto decai em ~1.6 s
  useFrame(() => {
    const m = motion.current;
    const s = surface.current;
    const t = trailState.current.trail;
    if (!m || !s) return;
    if (m.speed > 0.01 && m.time - t.lastPush > 0.07) {
      t.pos[t.head].copy(s.current);
      t.born[t.head] = m.time;
      t.head = (t.head + 1) % TRAIL_N;
      t.lastPush = m.time;
    }
    for (let i = 0; i < TRAIL_N; i++) {
      const life = 1 - (m.time - t.born[i]) / TRAIL_LIFE;
      t.strength[i] = life > 0 ? life * life : 0;
    }
  });

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      map,
      emissiveMap,
      emissive: new THREE.Color("#A89CF0"),
      emissiveIntensity: 0.32,
      roughness: 0.55,
      metalness: 0.15,
      clearcoat: 0.4,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.6,
    });
    // Rastro: trilhas perto das últimas posições do chip acendem e apagam (decai no emissive)
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, trailState.current.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vLocalDir;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLocalDir = normalize(position);");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          #define TRAIL_N ${TRAIL_N}
          varying vec3 vLocalDir;
          uniform vec3 uTrailPos[TRAIL_N];
          uniform float uTrailStr[TRAIL_N];
          uniform float uTrailSharp;
          uniform vec3 uTrailColor;`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float trail = 0.0;
          for (int i = 0; i < TRAIL_N; i++) {
            vec3 d = vLocalDir - uTrailPos[i];
            trail += uTrailStr[i] * exp(-dot(d, d) * uTrailSharp);
          }
          #ifdef USE_EMISSIVEMAP
            totalEmissiveRadiance += emissiveColor.rgb * uTrailColor * min(trail, 1.4);
          #endif`,
        );
    };
    m.customProgramCacheKey = () => "df-globe-trail";
    return m;
  }, [map, emissiveMap]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material}>
      <sphereGeometry args={getRenderQuality() === "low" ? [R, 96, 64] : [R, 128, 96]} />
    </mesh>
  );
}

const HALO_SCALE = 1.13;

/**
 * Atmosfera lavanda: halo fora da silhueta (esfera BackSide maior) com queda radial suave até zero na borda, e
 * um fresnel sutil no limbo do próprio globo (FrontSide). Os dois aditivos, sem escrever profundidade.
 */
function Atmosphere() {
  const materials = useMemo(() => {
    const color = new THREE.Color("#A89CF0");
    const halo = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uColor: { value: color }, uRadius: { value: R }, uScale: { value: HALO_SCALE } },
      vertexShader: `
        varying vec3 vView;
        varying vec3 vCenter;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = mv.xyz;
          vCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uRadius;
        uniform float uScale;
        varying vec3 vView;
        varying vec3 vCenter;
        void main() {
          float d = length(vView.xy - vCenter.xy) / uRadius;
          float t = clamp((d - 1.0) / (uScale - 1.0), 0.0, 1.0);
          float i = pow(1.0 - t, 2.6) * 0.7;
          gl_FragColor = vec4(uColor * i, i);
        }`,
    });
    const limb = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uColor: { value: color } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        void main() {
          float i = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0) * 0.5;
          gl_FragColor = vec4(uColor * i, i);
        }`,
    });
    return { halo, limb };
  }, []);
  useEffect(
    () => () => {
      materials.halo.dispose();
      materials.limb.dispose();
    },
    [materials],
  );
  return (
    <>
      <mesh material={materials.halo} scale={HALO_SCALE}>
        <sphereGeometry args={[R, 64, 48]} />
      </mesh>
      <mesh material={materials.limb} scale={1.002}>
        <sphereGeometry args={[R, 64, 48]} />
      </mesh>
    </>
  );
}

// --- chip ---------------------------------------------------------------------------------------------------

const HALF = 0.21;
const PIN_LEN = 0.11;
const PIN_DROOP = 0.8;
const PIN_Y = 0.1;
const OFFSETS = [-0.16, -0.08, 0, 0.08, 0.16];
// Lados: normal para fora, yaw que aponta o pino (+X) para fora, fase da passada
const SIDES = [
  { n: [1, 0], yaw: 0, phase: 0, gait: 1 },
  { n: [-1, 0], yaw: Math.PI, phase: Math.PI, gait: 1 },
  { n: [0, 1], yaw: -Math.PI / 2, phase: Math.PI / 2, gait: 0.35 },
  { n: [0, -1], yaw: Math.PI / 2, phase: -Math.PI / 2, gait: 0.35 },
] as const;
const PIN_COUNT = SIDES.length * OFFSETS.length;

function ChipDecal() {
  // URL própria para a textura: o useLoader do R3F acha que SVGLoader e TextureLoader são o mesmo loader (compara
  // as classes pelas props estáticas herdadas de Loader) e divide o cache pela URL. Com a mesma URL do DfMark, quem
  // carregasse primeiro "ganhava" e o outro recebia o objeto errado (o DfMark quebrava e desligava todo o 3D).
  const texture = useTexture("/assets/logo/df-monogram-branco.svg?as=texture");
  return (
    <mesh position-y={0.183} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[0.24, 0.24 * (578.5 / 683.5)]} />
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive="#5749A5"
        emissiveIntensity={0.9}
        color="#D9D3FF"
        transparent
        opacity={0.42}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}

function Chip({ motion, sim }: { motion: RefObject<Motion>; sim: RefObject<GlobeSim> }) {
  const facing = useRef<THREE.Group>(null);
  const lean = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const pins = useRef<THREE.InstancedMesh>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const state = useRef({ greetTurn: false, turnVel: 0, greetT: 0, prevSpeed: 0, accel: 0 });

  const pinGeometry = useMemo(() => new THREE.BoxGeometry(PIN_LEN, 0.018, 0.034).translate(PIN_LEN / 2, 0, 0), []);
  useEffect(() => () => pinGeometry.dispose(), [pinGeometry]);
  const dummy = useMemo(() => {
    const o = new THREE.Object3D();
    o.rotation.order = "YXZ";
    return o;
  }, []);

  useFrame((_, delta) => {
    const m = motion.current;
    const cfg = sim.current;
    if (!m || !cfg || !cfg.active || !facing.current || !lean.current || !body.current || !pins.current) return;
    const dt = Math.min(delta, 0.05);
    const st = state.current;
    const paused = !cfg.auto;
    const reduced = cfg.reduced;

    // Direção: anda para onde vai; pausado, para e vira de frente para a câmera (saudação)
    if (!paused) {
      st.greetTurn = false;
      st.greetT = 0;
    } else if (m.activity < 0.06) st.greetTurn = true;
    const current = facing.current.rotation.y;
    const desired = paused ? (st.greetTurn ? m.cameraHeading : current) : m.heading;
    const turn = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
    if (paused) {
      const acc = clamp(18 * turn - 8.5 * st.turnVel, -5.5, 5.5);
      st.turnVel = clamp(st.turnVel + acc * dt, -2.2, 2.2);
      if (Math.abs(turn) < 3e-3 && Math.abs(st.turnVel) < 0.025) st.turnVel = 0;
      facing.current.rotation.y += st.turnVel * dt;
    } else if (m.speed > 0.004) {
      facing.current.rotation.y += turn * (1 - Math.exp(-12 * dt));
      st.turnVel = 0;
    }

    // LED: respira devagar; na saudação pisca 3 vezes quando o chip termina de virar
    const aligned = paused && st.greetTurn && Math.abs(turn) < 0.06 && Math.abs(st.turnVel) < 0.15;
    if (aligned) st.greetT += dt;
    const blinking = st.greetT > 0 && st.greetT < 1.5;
    if (led.current) {
      led.current.emissiveIntensity = blinking
        ? (st.greetT * 2) % 1 < 0.5
          ? 4
          : 0.15
        : 1.1 + (reduced ? 0 : 0.35 * Math.sin(m.time * 2.2));
    }

    // Inclina para frente ao acelerar/andar (sem balanço em reduced motion)
    st.accel = damp(st.accel, (m.speed - st.prevSpeed) / Math.max(dt, 1e-4), 6, dt);
    st.prevSpeed = m.speed;
    const leanTarget = reduced ? 0 : clamp(m.speed * 1.1 + st.accel * 0.04, 0, 0.14);
    lean.current.rotation.x = damp(lean.current.rotation.x, leanTarget, 9, dt);
    body.current.position.y = reduced ? 0 : m.activity * 0.012 * Math.abs(Math.sin(m.phase * 2));

    // Pinos como pernas: lados opostos em contrafase, onda ao longo de cada lado; parado, só "respira"
    const amp = (reduced ? 0.25 : 0.55) * m.activity;
    let i = 0;
    for (const side of SIDES) {
      OFFSETS.forEach((off, k) => {
        const along = side.n[0] !== 0 ? [0, off] : [off, 0];
        const wave = Math.sin(m.phase + side.phase + k * 0.9);
        const lift = amp * side.gait * Math.max(0, wave);
        const breath = (1 - m.activity) * 0.015 * Math.sin(m.time * 1.7 + i * 0.4);
        const swing = reduced ? 0 : amp * side.gait * 0.35 * Math.cos(m.phase + side.phase + k * 0.9);
        dummy.position.set(side.n[0] * HALF + along[0], PIN_Y, side.n[1] * HALF + along[1]);
        dummy.rotation.set(0, side.yaw + swing, -(PIN_DROOP - lift + breath));
        dummy.updateMatrix();
        pins.current!.setMatrixAt(i++, dummy.matrix);
      });
    }
    pins.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={facing}>
      <group ref={lean}>
        <group ref={body}>
          {/* Corpo grafite e topo um pouco mais claro */}
          <RoundedBox args={[HALF * 2, 0.09, HALF * 2]} radius={0.02} smoothness={4} position-y={0.125}>
            <meshPhysicalMaterial color="#2A2A38" roughness={0.45} metalness={0.3} clearcoat={0.5} />
          </RoundedBox>
          <RoundedBox args={[0.36, 0.012, 0.36]} radius={0.005} smoothness={2} position-y={0.174}>
            <meshPhysicalMaterial color="#3A3A4E" roughness={0.35} metalness={0.25} clearcoat={0.8} />
          </RoundedBox>
          <Suspense fallback={null}>
            <ChipDecal />
          </Suspense>
          {/* LED no canto da frente (+Z) */}
          <mesh position={[0.13, 0.186, 0.13]}>
            <sphereGeometry args={[0.016, 16, 12]} />
            <meshStandardMaterial ref={led} color="#E4DEFF" emissive="#A89CF0" emissiveIntensity={1.1} toneMapped={false} />
          </mesh>
          <instancedMesh ref={pins} args={[pinGeometry, undefined, PIN_COUNT]}>
            <meshStandardMaterial color="#C9CCD6" metalness={0.9} roughness={0.3} />
          </instancedMesh>
        </group>
      </group>
    </group>
  );
}

// --- cena ---------------------------------------------------------------------------------------------------

type Props = {
  className?: string;
  motion: RefObject<Motion>;
  sim: RefObject<GlobeSim>;
};

function Scene({ motion, sim, viewRef }: Props & { viewRef: RefObject<HTMLElement | THREE.Group | null> }) {
  const world = useRef<THREE.Group>(null);
  const planet = useRef<THREE.Group>(null);
  const runner = useRef<THREE.Group>(null);
  // Estado mutável da simulação em refs (mutado a cada frame, nunca lido no render)
  const globe = useRef<GlobeState>(createGlobe());
  const surface = useRef<Surface>(createSurface());

  // Física antes do render do View (prioridade padrão 0 < 1 do View)
  useFrame((state, delta) => {
    const m = motion.current;
    const cfg = sim.current;
    const view = viewRef.current;
    const g = globe.current;
    const s = surface.current;
    if (!m || !cfg || !world.current || !planet.current || !runner.current) return;

    // Câmera ortográfica dimensionada pelo container (mesma regra da referência)
    if (view instanceof HTMLElement) {
      const rect = view.getBoundingClientRect();
      const small = rect.width < 700;
      const zoom = rect.width / (small ? 5.65 : 5.25);
      const camera = state.camera as THREE.OrthographicCamera;
      if (Math.abs(camera.zoom - zoom) > 0.01) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
      world.current.position.y = (rect.height / zoom) * (small ? 0.08 : 0.19) - 2.17;
    }

    // Fora da viewport ou aba oculta: nada de simulação (o View também não desenha)
    if (!cfg.active) return;

    const elapsed = Math.min(delta, 0.05);
    const count = Math.max(1, Math.ceil(elapsed / STEP));
    for (let i = 0; i < count; i++) {
      const dt = elapsed / count;
      stepGlobe(g, m, dt, cfg.auto, cfg.reduced);
      stepSurface(s, m, g.orientation, DESIRED_UP, dt, cfg.reduced, !cfg.auto);
    }

    planet.current.quaternion.copy(g.orientation);
    runner.current.position.copy(s.worldNormal).multiplyScalar(R + 0.004);
    runner.current.quaternion.setFromUnitVectors(UP, s.worldNormal);

    updateHeadings(m, runner.current.quaternion, s.worldVelocity);
  });

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 9]} near={0.1} far={30} />
      <ambientLight intensity={0.25} />
      {/* Principal branca suave de cima, contorno roxo por trás, preenchimento lavanda */}
      <directionalLight position={[-1.5, 5, 4]} intensity={1.7} color="#F2F2F2" />
      <pointLight position={[3.5, 1.5, -4]} intensity={70} color="#5749A5" />
      <pointLight position={[-4, -1, -3]} intensity={45} color="#5749A5" />
      <directionalLight position={[-5, 0.5, 3]} intensity={0.55} color="#A89CF0" />

      <group ref={world}>
        <group ref={planet}>
          <Globe motion={motion} surface={surface} />
        </group>
        <Atmosphere />
        <group ref={runner} scale={1.1}>
          <Chip motion={motion} sim={sim} />
        </group>
      </group>
      <StudioEnvironment />
    </>
  );
}

/** Globo-circuito + chip do hero, desenhado no canvas global via View. */
export default function HeroGlobe({ className, motion, sim }: Props) {
  const viewRef = useRef<HTMLElement | THREE.Group>(null);
  return (
    <View ref={viewRef} className={className}>
      <Suspense fallback={null}>
        <Scene motion={motion} sim={sim} viewRef={viewRef} />
      </Suspense>
    </View>
  );
}
