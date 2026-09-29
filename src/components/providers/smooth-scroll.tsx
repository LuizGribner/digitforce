"use client";

import { useEffect } from "react";
import Lenis from "lenis";

import { gsap, ScrollTrigger } from "@/lib/gsap";

let current: Lenis | null = null;

/** Instância ativa do Lenis (null com reduced motion ou antes do mount). Usada p.ex. para pausar durante arrastos. */
export const getLenis = () => current;

/**
 * Smooth scroll (Lenis) no site inteiro, sincronizado com o ScrollTrigger.
 * - Lenis roda no ticker do GSAP (um único rAF), com prioridade: rola primeiro, o resto do frame já lê a
 *   posição nova (inclusive o canvas 3D, que também avança pelo ticker; ver scene-canvas.tsx).
 * - anchors: true faz os links #secao rolarem pelo Lenis, respeitando o scroll-margin-top das seções.
 * - Com prefers-reduced-motion o Lenis não é criado (rolagem nativa).
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ lerp: 0.1, anchors: true, autoRaf: false });
      current = lenis;
      lenis.on("scroll", ScrollTrigger.update);

      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick, false, true);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
        current = null;
      };
    });

    // Posições dos triggers dependem das fontes (títulos quebram diferente) e das imagens
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
    };
  }, []);

  return <>{children}</>;
}
