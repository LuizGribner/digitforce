"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { orbitState } from "./orbit-state";
import { HOVER_SCALE, maxScaleAt, orbitPose, solveLayout, stackPose, type OrbitLayout } from "./orbit-layout";

const IntegrationsMark = dynamic(() => import("@/components/three/integrations-mark"), { ssr: false });

const P = "/assets/produtos";

type Card = { id: keyof Dictionary["orbit"]["cards"]; img: string; mobileHidden?: boolean };

// Ordem da órbita; todos com foto. Versões "-sm" (640px): o card mostra no máximo ~220px e a original de até 1600px
// custava até 7,5MB de memória decodificada por imagem no celular. Nome e frase de cada card ficam no dicionário
// (orbit.cards). TODO: revisar as frases curtas com o cliente
export const CARDS: Card[] = [
  { id: "interfone", img: `${P}/interfone/unidade-externa-frente-sm.webp` },
  { id: "monitor", img: `${P}/interfone/monitor-interno-frente-tela-ligada-sm.webp` },
  { id: "app", img: `${P}/elevador/app-tela-sm.webp` },
  { id: "camera", img: `${P}/elevador/camera-luz-teto.webp` },
  { id: "elevador", img: `${P}/elevador/intercomunicador-cabine-a-sm.webp` },
  { id: "botao", img: `${P}/elevador/botao-emergencia.webp` },
  { id: "terminal", img: `${P}/elevador/terminal-monitoramento-sm.webp`, mobileHidden: true },
  { id: "sensor", img: `${P}/elevador/sensor-sm.webp`, mobileHidden: true },
];

/**
 * quickSetter não aceita aliases que viram várias propriedades ("scale" -> "scaleX,scaleY", "autoAlpha"): cai no
 * setAttribute("scaleX,scaleY") e derruba a página. Escala uniforme = dois setters.
 */
const scaleSetter = (el: Element) => {
  const sx = gsap.quickSetter(el, "scaleX");
  const sy = gsap.quickSetter(el, "scaleY");
  return (v: number) => {
    sx(v);
    sy(v);
  };
};

// Escala mínima efetiva do texto dos cards (12px * 0.9 ~ 11px na tela)
const MIN_TEXT_SCALE = 0.9;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type Api = { activate?: (index: number | null) => void };

export function IntegrationsOrbit({ enable3D }: { enable3D: boolean }) {
  const section = useRef<HTMLElement>(null);
  const { dict, t } = useI18n();
  const activeRef = useRef<number | null>(null);
  const api = useRef<Api>({});
  const [active, setActive] = useState<number | null>(null);
  // Último tipo de interação: no toque o foco chega antes do clique e não pode abrir a frase sozinho
  const lastInput = useRef<"mouse" | "touch" | "pen" | "keyboard">("mouse");

  const select = (index: number | null) => {
    if (activeRef.current === index) return;
    activeRef.current = index;
    setActive(index);
    api.current.activate?.(index);
  };

  useEffect(() => {
    const onKey = () => (lastInput.current = "keyboard");
    // Tocar fora de um card fecha a frase aberta
    const onDown = (e: PointerEvent) => {
      lastInput.current = e.pointerType as typeof lastInput.current;
      if (activeRef.current !== null && !(e.target as Element).closest?.("[data-card]")) select(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, { capture: true });
    };
  });

  useGSAP(
    (_, contextSafe) => {
      const root = section.current;
      if (!root || !contextSafe) return;
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px)",
          touch: "(pointer: coarse)",
        },
        (ctx) => {
          const { motion, mobile, touch } = ctx.conditions as { motion: boolean; mobile: boolean; touch: boolean };
          const q = (s: string) => root.querySelector<HTMLElement>(s);
          const layer = q(".orbit-cards")!;
          const allCards = gsap.utils.toArray<HTMLElement>("[data-card]", root);
          // Mobile: 6 cards (sem Terminal e Sensor)
          const cards = allCards.filter((el) => !(mobile && el.dataset.mobileHidden === "true"));
          const n = cards.length;
          const textBox = q("[data-orbit-text-box]")!;
          const text = q("[data-orbit-text]")!;
          const center = [q("[data-orbit-center]")!, q("[data-orbit-glow-box]")!, q("[data-orbit-pulse-box]")!];
          const glow = q("[data-orbit-glow]")!;
          const fallback = q("[data-orbit-fallback]");
          const pulse = q("[data-orbit-pulse]")!;
          const lines = [...root.querySelectorAll<SVGPathElement>("[data-orbit-line]")];

          const set = cards.map((el) => ({
            x: gsap.quickSetter(el, "x", "px"),
            y: gsap.quickSetter(el, "y", "px"),
            r: gsap.quickSetter(el, "rotation", "deg"),
            s: scaleSetter(el),
            o: gsap.quickSetter(el, "opacity"),
            z: gsap.quickSetter(el, "zIndex"),
          }));
          const back = new Array(n).fill(false);
          // Contraescala do texto (nome e frase): os cards de trás chegam a ~0.5 da escala e o texto ficava ilegível.
          // Valor em degraus de 0.05, gravado só quando muda (mexe na largura do nome, então não pode ser por frame)
          const textScale = new Array(n).fill(1);
          const setText = { o: gsap.quickSetter(text, "opacity"), y: gsap.quickSetter(text, "y", "px") };
          const setGlow = { o: gsap.quickSetter(glow, "opacity"), s: scaleSetter(glow) };
          const setFallback = fallback ? { o: gsap.quickSetter(fallback, "opacity"), s: scaleSetter(fallback) } : null;

          const st = { p: motion ? 0 : 1, spin: 0, cardW: 1, cardH: 1 };
          let L: OrbitLayout = { W: 1, H: 1, cy: 0, rx: 0, ry: 0, k: 1, zoneTop: 0, bottom: 1 };
          const hover = new Array(n).fill(0);
          const pointer = { x: 0, y: 0 };
          const toX = gsap.quickTo(pointer, "x", { duration: 0.9, ease: "power3" });
          const toY = gsap.quickTo(pointer, "y", { duration: 0.9, ease: "power3" });
          const parallax = mobile ? 0 : 22;
          const activePos = () => (activeRef.current === null ? -1 : cards.indexOf(allCards[activeRef.current]));

          // Zonas e elipse a partir das medidas reais (layout, sem transforms); refeito no resize
          const measure = () => {
            const W = layer.clientWidth;
            const H = layer.clientHeight;
            st.cardW = cards[0].offsetWidth;
            st.cardH = cards[0].offsetHeight;
            const zoneTop = textBox.offsetTop + textBox.offsetHeight + 32;
            L = solveLayout({ W, H, zoneTop, cardW: st.cardW, cardH: st.cardH, n });
            // "df", brilho e pulso no centro da elipse (posição de layout, não animada)
            center.forEach((el) => (el.style.top = `${L.cy}px`));
          };

          const render = () => {
            const { W, H } = L;
            const spread = inOutCubic(clamp01((st.p - 0.06) / 0.74));
            // Texto entra quando a pilha começa a abrir; "df" só depois de 60% de abertura
            const tT = clamp01((st.p - 0.03) / 0.17);
            setText.o(tT);
            setText.y((1 - tT) * 18);
            const dT = clamp01((spread - 0.6) / 0.4);
            const dfReveal = dT * (2 - dT);
            orbitState.reveal = dfReveal;
            setGlow.o(dfReveal);
            setGlow.s(0.6 + 0.4 * dfReveal);
            setFallback?.o(dfReveal);
            setFallback?.s(0.6 + 0.4 * dfReveal);

            for (let i = 0; i < n; i++) {
              const a = stackPose(i, n, L);
              const b = orbitPose(i, n, st.spin, L);
              const h = hover[i];
              const front = ((b.depth + 1) / 2) * spread;
              const par = parallax * (0.35 + front) * spread;
              const x = a.x + (b.x - a.x) * spread + pointer.x * par;
              const y = a.y + (b.y - a.y) * spread + pointer.y * par * 0.6;
              let scale = a.scale + (b.scale - a.scale) * spread;
              scale += (HOVER_SCALE * L.k - scale) * h;
              // Nunca invade a zona do texto nem sai pela base (vale também para hover e parallax)
              scale = Math.min(scale, maxScaleAt(y, st.cardH, L));
              // Parte de trás da elipse: mais transparente e com leve blur
              const backness = clamp01((-b.depth - 0.15) / 0.7) * spread * (1 - h);
              set[i].x(x - W / 2);
              set[i].y(y - H / 2);
              set[i].r((a.rot + (b.rot - a.rot) * spread) * (1 - h));
              set[i].s(scale);
              set[i].o(1 - 0.45 * backness);
              set[i].z(h > 0.02 ? 500 : spread < 0.5 ? i + 1 : Math.round((b.depth + 1) * 100) + 1);
              const ts = Math.round(Math.max(1, MIN_TEXT_SCALE / scale) * 20) / 20;
              if (ts !== textScale[i]) {
                textScale[i] = ts;
                cards[i].style.setProperty("--ts", String(ts));
              }
              const isBack = backness > 0.5;
              if (isBack !== back[i]) {
                back[i] = isBack;
                cards[i].dataset.back = String(isBack);
              }
            }
          };

          const tick = (_time: number, deltaTime: number) => {
            const dt = Math.min(deltaTime / 1000, 0.05);
            const pos = activePos();
            for (let i = 0; i < n; i++) {
              const target = i === pos ? 1 : 0;
              hover[i] = motion ? hover[i] + (target - hover[i]) * (1 - Math.exp(-14 * dt)) : target;
            }
            // Giro lento em volta da elipse depois de ~95%; pausa com hover/foco
            if (motion && st.p > 0.95 && pos < 0) st.spin += dt * 0.12;
            render();
          };

          // Linha de luz do card até o "df" (centro da elipse), com um brilho curto quando chega
          api.current.activate = contextSafe((index: number | null) => {
            gsap.killTweensOf([...lines, pulse, orbitState]);
            gsap.set(orbitState, { flash: 0 });
            const pos = index === null ? -1 : cards.indexOf(allCards[index]);
            if (pos < 0) {
              gsap.to(lines, { autoAlpha: 0, duration: 0.25 });
              return;
            }
            const box = layer.getBoundingClientRect();
            const r = cards[pos].getBoundingClientRect();
            const cx = r.left + r.width / 2 - box.left;
            const cy = r.top + r.height / 2 - box.top;
            // Cards acima do centro abrem a frase para baixo, para ela não invadir a zona do texto
            cards[pos].dataset.tip = cy < L.cy ? "below" : "above";
            const tx = L.W / 2;
            const ty = L.cy;
            const dx = tx - cx;
            const dy = ty - cy;
            const k = Math.min(r.width / 2 / Math.max(Math.abs(dx), 1e-3), r.height / 2 / Math.max(Math.abs(dy), 1e-3), 1);
            const sx = cx + dx * k;
            const sy = cy + dy * k;
            const d = `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${((sx + tx) / 2 - dy * 0.15).toFixed(1)} ${((sy + ty) / 2 + dx * 0.15).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
            lines.forEach((l) => l.setAttribute("d", d));
            gsap.set(lines, { autoAlpha: 1 });
            gsap.fromTo(
              lines,
              { drawSVG: "0% 0%" },
              {
                drawSVG: "0% 100%",
                duration: motion ? 0.55 : 0,
                ease: "power2.inOut",
                onComplete: () => {
                  gsap.fromTo(orbitState, { flash: 1 }, { flash: 0, duration: 0.9, ease: "power2.out" });
                  gsap.fromTo(pulse, { autoAlpha: 0.9, scale: 0.6 }, { autoAlpha: 0, scale: 1.4, duration: 0.9, ease: "power2.out" });
                },
              },
            );
          });

          measure();
          render();

          // Ticker só com a seção na tela; will-change só nesse intervalo
          ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => {
              if (self.isActive) gsap.ticker.add(tick);
              else gsap.ticker.remove(tick);
              cards.forEach((el) => (el.style.willChange = self.isActive ? "transform, opacity" : ""));
            },
            onRefresh: () => {
              measure();
              render();
            },
          });

          if (motion) {
            // Pilha -> órbita guiada pelo scroll (pin via sticky, ver CSS), scrub suave
            gsap.to(st, {
              p: 1,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: "bottom bottom",
                // Toque: uma passada abre a órbita inteira (snap direcional até o fim), scrub curto
                scrub: touch ? 0.4 : 1,
                snap: touch
                  ? { snapTo: [0, 1], directional: true, inertia: false, delay: 0.05, duration: { min: 0.5, max: 1 }, ease: "power2.inOut" }
                  : undefined,
              },
              onUpdate: render,
            });
          }

          const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return;
            toX((e.clientX / window.innerWidth) * 2 - 1);
            toY((e.clientY / window.innerHeight) * 2 - 1);
          };
          const onLeave = () => {
            toX(0);
            toY(0);
          };
          if (motion && !mobile) {
            root.addEventListener("pointermove", onMove);
            root.addEventListener("pointerleave", onLeave);
          }

          return () => {
            gsap.ticker.remove(tick);
            root.removeEventListener("pointermove", onMove);
            root.removeEventListener("pointerleave", onLeave);
            cards.forEach((el) => {
              delete el.dataset.back;
              el.style.removeProperty("--ts");
            });
            api.current.activate = undefined;
            orbitState.reveal = 1;
            orbitState.flash = 0;
          };
        },
        root,
      );

      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="solucoes" className="orbit" aria-labelledby="orbit-title">
      {/* 1. Fundo (z 4): brilho roxo, pulso e o "df". O canvas 3D (z 5) desenha o "df" logo acima desta camada */}
      <div className="orbit-bg">
        <div data-orbit-glow-box className="absolute left-1/2 h-[36svh] w-[36svh] -translate-x-1/2 -translate-y-1/2">
          <div
            data-orbit-glow
            className="h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(87,73,165,0.55),rgba(87,73,165,0.14)_55%,transparent)] opacity-0"
          />
        </div>
        <div data-orbit-pulse-box className="absolute left-1/2 h-[24svh] w-[24svh] -translate-x-1/2 -translate-y-1/2">
          <div
            data-orbit-pulse
            className="invisible h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(168,156,240,0.5),transparent)] opacity-0"
          />
        </div>
        <div data-orbit-center className="absolute left-1/2 aspect-square w-[min(14svh,120px)] -translate-x-1/2 -translate-y-1/2">
          {enable3D ? (
            <IntegrationsMark className="absolute inset-0" />
          ) : (
            <div data-orbit-fallback className="absolute inset-0 flex items-center justify-center opacity-0">
              <Image src="/assets/logo/df-monogram-branco.svg" alt="" width={220} height={186} className="w-[78%] opacity-85" />
            </div>
          )}
        </div>
      </div>

      {/* 2. Cards (z 8, acima do canvas): o "df" fica atrás de todos eles */}
      <div className="orbit-cards">
        {CARDS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            data-card
            data-mobile-hidden={c.mobileHidden ? "true" : undefined}
            aria-describedby={`orbit-tip-${c.id}`}
            className={cn(
              "orbit-card glass rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#A89CF0]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--df-navy)]",
              c.mobileHidden && "max-md:hidden",
            )}
            onPointerEnter={(e) => e.pointerType === "mouse" && select(i)}
            onPointerLeave={(e) => e.pointerType === "mouse" && activeRef.current === i && select(null)}
            // Teclado: o foco mostra a frase. No toque quem decide é o clique (senão abre e fecha no mesmo toque)
            onFocus={() => lastInput.current === "keyboard" && select(i)}
            onBlur={() => lastInput.current === "keyboard" && activeRef.current === i && select(null)}
            // Toque/caneta/Enter: alterna a frase (no mouse o hover já cuida)
            onClick={() => lastInput.current !== "mouse" && select(activeRef.current === i ? null : i)}
          >
            <span className="orbit-card-body pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              {/* Vidro escuro, mais claro no topo */}
              <span className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-[#000024]/40" />
              {/* Brilho roxo atrás do produto */}
              <span className="absolute inset-0 bg-[radial-gradient(closest-side_at_50%_42%,rgba(87,73,165,0.55),transparent)]" />
              <span className="absolute inset-x-[12%] bottom-[25%] top-[9%]">
                <Image
                  src={c.img}
                  alt=""
                  fill
                  sizes="220px"
                  loading="lazy"
                  decoding="async"
                  className="object-contain drop-shadow-[0_10px_16px_rgba(0,0,24,0.55)]"
                />
              </span>
              <span className="orbit-card-name absolute bottom-0 left-1/2 -translate-x-1/2 bg-gradient-to-t from-[#000024]/85 via-[#000024]/45 to-transparent px-3 pb-3 pt-10 text-center text-[11px] font-semibold leading-tight text-[#F2F2F2] md:text-xs">
                {dict.orbit.cards[c.id].name}
              </span>
            </span>
            <span
              id={`orbit-tip-${c.id}`}
              role="tooltip"
              className={cn(
                "orbit-tip glass-strong pointer-events-none absolute left-1/2 w-[min(220px,62vw)] -translate-x-1/2 rounded-xl px-3 py-2 text-center text-xs font-medium leading-snug text-[#F2F2F2] transition-opacity duration-200",
                active === i ? "opacity-100" : "opacity-0",
              )}
            >
              {dict.orbit.cards[c.id].text}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Topo (z 10, acima de tudo): texto na zona livre e a linha de luz */}
      <div className="orbit-top">
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path data-orbit-line fill="none" stroke="#A89CF0" strokeWidth={6} strokeOpacity={0.35} strokeLinecap="round" className="invisible [filter:blur(3px)]" />
          <path data-orbit-line fill="none" stroke="#E4DEFF" strokeWidth={1.4} strokeLinecap="round" className="invisible" />
        </svg>
        <div data-orbit-text-box className="absolute inset-x-0 top-[12svh] mx-auto w-full max-w-3xl px-6 text-center">
          <div data-orbit-text>
            <h2
              id="orbit-title"
              className="text-balance text-3xl font-semibold leading-tight md:text-5xl md:[@media(max-height:820px)]:text-4xl"
            >
              {t("orbit.titleA")} <span className="df-gradient-text">{t("orbit.titleB")}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-balance text-sm text-[var(--muted-foreground)] md:text-base">
              {t("orbit.subtitle")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
