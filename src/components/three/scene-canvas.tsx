"use client";

import { useEffect } from "react";
import { advance, Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";

import { gsap } from "@/lib/gsap";
import { maxDpr } from "@/components/hero-globe/render-quality";
import { AdaptiveResolution } from "./adaptive-resolution";

/**
 * Canvas único da página. Cada seção com 3D renderiza um <View> no DOM e o conteúdo dele é desenhado
 * aqui, recortado no retângulo do View. Fica acima dos fundos dos cards (para os modelos poderem
 * escapar da borda) e abaixo do conteúdo interativo (z-10+); não recebe cliques.
 *
 * frameloop="never" + advance() no ticker do GSAP: o canvas renderiza no mesmo rAF do Lenis e depois dele
 * (o Lenis entra no ticker com prioridade), então os Views leem a posição de scroll do próprio frame e não
 * ficam um frame atrasados em relação ao DOM durante o smooth scroll.
 */
export default function SceneCanvas() {
  useEffect(() => {
    const tick = (time: number) => advance(time);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <Canvas
      frameloop="never"
      eventSource={document.body}
      eventPrefix="client"
      // NoToneMapping: o ACES acinzentava a lavanda (#E6E1FF -> #DAD8E2) e desbotava o #A89CF0
      flat
      // Começa no máximo do dispositivo (2 desktop forte, 1.25 mobile/fraco); AdaptiveResolution ajusta por FPS
      dpr={[1, maxDpr()]}
      gl={{ alpha: true, antialias: true }}
      style={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}
      aria-hidden
    >
      <AdaptiveResolution />
      <View.Port />
    </Canvas>
  );
}
