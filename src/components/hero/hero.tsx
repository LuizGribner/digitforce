"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { Spotlight } from "@/components/ui/spotlight";
import { createMotion, type Motion } from "@/components/hero-globe/globe-motion";
import type { GlobeSim } from "@/components/three/hero-globe";
import { getLenis } from "@/components/providers/smooth-scroll";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

const HeroGlobe = dynamic(() => import("@/components/three/hero-globe"), { ssr: false });

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useReducedMotion = () =>
  useSyncExternalStore(subscribeReduced, () => matchMedia(REDUCED).matches, () => false);

type Drag = { id: number; x: number; y: number; touch: boolean };

export function Hero({ webgl, cta }: { webgl: boolean; cta: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const motion = useRef<Motion>(createMotion());
  const sim = useRef<GlobeSim>({ auto: true, reduced: false, active: true });
  const drag = useRef<Drag | null>(null);

  const reduced = useReducedMotion();
  const [auto, setAuto] = useState(true);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    sim.current.auto = auto;
    sim.current.reduced = reduced;
  }, [auto, reduced]);

  // Simulação só com o hero na viewport e a aba visível
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let inView = true;
    const update = () => (sim.current.active = inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(el);
    const onVisibility = () => {
      update();
      if (document.hidden) endDrag();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function endDrag(id?: number) {
    if (!drag.current || (id !== undefined && drag.current.id !== id)) return;
    drag.current = null;
    const m = motion.current;
    m.dragging = false;
    m.lastInteraction = m.time;
    setDragging(false);
    getLenis()?.start();
  }

  function toggleMotion() {
    const next = !auto;
    const m = motion.current;
    if (drag.current && stage.current?.hasPointerCapture(drag.current.id)) {
      stage.current.releasePointerCapture(drag.current.id);
    }
    drag.current = null;
    setDragging(false);
    getLenis()?.start();
    m.dragging = false;
    m.planetVelocity = m.pitchVelocity = 0;
    m.dragTarget = m.planetAngle;
    m.pitchTarget = m.pitchAngle;
    // Ao retomar, o roaming volta logo (sem esperar os 3,5 s)
    if (next) m.lastInteraction = m.time - 4;
    sim.current.auto = next;
    setAuto(next);
  }

  function nudge(direction: number) {
    if (!auto) return;
    motion.current.planetVelocity += direction * 0.65;
    motion.current.lastInteraction = motion.current.time;
  }

  // Entrada: linhas sobem de trás de uma máscara (uma vez), botão e seta da legenda
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(section);
        SplitText.create(q("[data-split]"), {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, { yPercent: 110, duration: 1.1, stagger: 0.09, ease: "dfSoft", delay: 0.15 }),
        });
        gsap.from(q("[data-reveal]"), { autoAlpha: 0, y: 16, duration: 0.9, ease: "dfSoft", delay: 0.75 });
        gsap.from(q("[data-arrow]"), { drawSVG: "0% 0%", duration: 0.9, stagger: 0.55, ease: "power2.inOut", delay: 1.1 });
        gsap.from(q("[data-caption]"), { autoAlpha: 0, duration: 0.8, delay: 1 });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  const caption = !auto ? "Aperte girar para continuar" : dragging ? "Força que protege." : "Arraste para girar";

  return (
    <section ref={section} aria-labelledby="hero-title" className="relative overflow-hidden lg:h-[100svh] lg:min-h-[680px]">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#A89CF0" />

      {/* Coluna de texto (z-10, acima do canvas) */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 pt-32 lg:h-full lg:justify-center lg:pt-10">
        <div className="lg:w-[45%]">
          <h1
            id="hero-title"
            data-split
            className="text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-[clamp(3.5rem,5vw,5.25rem)]"
          >
            Tecnologia que conecta.
            <br />
            <span className="df-gradient-text">Força que protege.</span>
          </h1>
          <p data-split className="mt-6 max-w-md text-[var(--muted-foreground)] md:text-lg">
            Interfonia digital, emergência para elevadores e IA para hotelaria. Do chip à integração, com suporte técnico no
            Brasil.
          </p>
          <div data-reveal className="mt-9 flex">
            {cta}
          </div>
        </div>
      </div>

      {/* Globo: à direita sangrando no desktop; embaixo, com leve sangria lateral, no tablet/mobile */}
      <div className="relative -mx-[12%] mt-2 h-[clamp(420px,105vw,680px)] w-[124%] lg:absolute lg:inset-y-0 lg:right-[-4%] lg:mx-0 lg:mt-0 lg:h-full lg:w-[60%]">
        <div
          ref={stage}
          tabIndex={0}
          role="group"
          aria-roledescription="globo 3D interativo"
          aria-label="Girar o globo em 3D"
          aria-describedby="globe-instructions"
          className={cn(
            // pan-y: no toque, arrastar para os lados gira o globo e na vertical a página rola normalmente
            // (o navegador assume o gesto vertical e manda pointercancel, que solta o globo). Mouse/caneta: 2 eixos.
            "absolute inset-0 touch-pan-y select-none rounded-[36px] outline-none focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-[#A89CF0]/50 focus-visible:-outline-offset-[18px]",
            auto && (dragging ? "cursor-grabbing" : "cursor-grab"),
          )}
          onPointerDown={(e) => {
            if (!auto || !e.isPrimary || e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            const touch = e.pointerType === "touch";
            drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, touch };
            const m = motion.current;
            m.dragTarget = m.planetAngle;
            m.pitchTarget = m.pitchAngle;
            m.dragging = true;
            m.lastInteraction = m.time;
            setDragging(true);
            // No toque o scroll é nativo (Lenis não intercepta touch); parar o Lenis ali travaria a página
            if (!touch) getLenis()?.stop();
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!auto || !d || d.id !== e.pointerId) return;
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            const sensitivity = 5 / Math.max(360, e.currentTarget.clientWidth);
            const m = motion.current;
            // Alvo limitado perto do ângulo atual: a mola nunca dá saltos grandes
            m.dragTarget = Math.max(m.planetAngle - 0.5, Math.min(m.planetAngle + 0.5, m.dragTarget + dx * sensitivity));
            // No toque o eixo vertical é da página: só o giro horizontal
            if (!d.touch) {
              m.pitchTarget = Math.max(m.pitchAngle - 0.4, Math.min(m.pitchAngle + 0.4, m.pitchTarget + dy * sensitivity * 0.7));
            }
            d.x = e.clientX;
            d.y = e.clientY;
            m.lastInteraction = m.time;
          }}
          onPointerUp={(e) => endDrag(e.pointerId)}
          onPointerCancel={(e) => endDrag(e.pointerId)}
          onLostPointerCapture={(e) => endDrag(e.pointerId)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              nudge(e.key === "ArrowRight" ? 1 : -1);
            } else if (auto && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
              e.preventDefault();
              motion.current.pitchVelocity += e.key === "ArrowDown" ? 0.4 : -0.4;
              motion.current.lastInteraction = motion.current.time;
            } else if (e.key === " ") {
              e.preventDefault();
              if (!e.repeat) toggleMotion();
            }
          }}
        >
          {webgl ? (
            <HeroGlobe className="pointer-events-none absolute inset-0" motion={motion} sim={sim} />
          ) : (
            // Fallback sem WebGL: "df" estático com o brilho roxo
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="df-glow absolute h-[70%] w-[70%]" />
              <Image src="/assets/logo/df-monogram-branco.svg" alt="" width={220} height={186} className="relative w-[34%] opacity-90" />
            </div>
          )}
        </div>

        {/* Legenda manuscrita com seta apontando para o globo */}
        <div
          data-caption
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-[16%] top-[3%] z-10 w-[150px] text-[#A89CF0] transition-opacity duration-300 lg:right-[14%] lg:top-[13%] lg:w-[170px]",
            dragging ? "opacity-45" : "opacity-75",
          )}
        >
          <p className="text-right text-[13px] font-normal italic leading-snug lg:text-[15px]">{caption}</p>
          <svg viewBox="0 0 160 140" fill="none" className="-ml-6 mt-1 h-auto w-[120px] lg:w-[140px]">
            <path data-arrow d="M150 6C142 64 102 106 30 128" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            <path data-arrow d="M30 128l15.6 3.4M30 128l11.5-11" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <p id="globe-instructions" className="sr-only">
        Arraste em qualquer direção, ou use as setas do teclado, para girar o globo 3D. A barra de espaço pausa o globo e o
        chip se vira para você; aperte de novo para voltar a girar. Em telas de toque, arraste para os lados para girar; na
        vertical, a página rola normalmente.
      </p>

      {/* Esconde o corte reto do globo na base do hero (acima do canvas, abaixo do texto) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-40 bg-gradient-to-b from-transparent to-[var(--df-navy)]" />

      {/* Rodapé sutil do hero */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex w-full max-w-6xl items-end justify-between px-6 pb-6 text-[11px] leading-relaxed text-[#A3A3C2] lg:pb-8 lg:text-xs">
          <p>
            <span className="mb-3 block h-px w-6 bg-[#A3A3C2]/60" />
            Do chip
            <br />à integração
          </p>
          <button
            type="button"
            onClick={toggleMotion}
            aria-pressed={!auto}
            aria-label={auto ? "Pausar o globo" : "Girar o globo"}
            // Alvo de toque de pelo menos 44px
            className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 py-2 opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          >
            {auto ? (
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <path d="M7 5v10m6-10v10" stroke="currentColor" strokeWidth={1.5} />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <path d="m7 4 8 6-8 6Z" fill="currentColor" />
              </svg>
            )}
            <span>{auto ? "Pausar" : "Girar"}</span>
          </button>
          <p className="text-right">
            Suporte técnico
            <br />
            no Brasil
          </p>
        </div>
      </div>
    </section>
  );
}
