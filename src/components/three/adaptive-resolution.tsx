"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { getRenderQuality, maxDpr } from "@/components/hero-globe/render-quality";

/**
 * Ajuste de dpr por FPS (portado do AdaptiveResolution da referência). Mede janelas de 2 s: abaixo de ~48 fps
 * desce 0.25; com 4 janelas seguidas acima de ~57 fps sobe 0.25. Fica no canvas global (o dpr é do canvas).
 */
export function AdaptiveResolution() {
  const setDpr = useThree((s) => s.setDpr);
  const sample = useRef<{ warmup: number; time: number; frames: number; good: number; dpr: number } | null>(null);

  useFrame((state, delta) => {
    const max = maxDpr();
    const min = Math.min(max, getRenderQuality() === "low" ? 1 : 1.25);
    sample.current ??= { warmup: 3, time: 0, frames: 0, good: 0, dpr: max };
    const s = sample.current;
    if (delta <= 0) return;
    if (s.warmup > 0) {
      s.warmup -= Math.min(delta, 0.1);
      return;
    }
    // Frame muito longo = aba voltando, scroll pesado pontual: descarta a janela
    if (delta > 0.12) {
      s.time = 0;
      s.frames = 0;
      return;
    }
    s.time += delta;
    s.frames++;
    if (s.time < 2) return;

    const frameTime = s.time / s.frames;
    s.dpr = state.viewport.dpr;
    let next = s.dpr;
    if (frameTime > 1 / 48) {
      next = Math.max(min, s.dpr - 0.25);
      s.good = 0;
    } else if (frameTime < 1 / 57) {
      if (++s.good >= 4) {
        next = Math.min(max, s.dpr + 0.25);
        s.good = 0;
      }
    } else s.good = 0;
    s.time = 0;
    s.frames = 0;
    if (next !== s.dpr) {
      s.dpr = next;
      setDpr(next);
      s.warmup = 1;
    }
  });

  return null;
}
