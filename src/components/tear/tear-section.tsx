"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import {
  WORD,
  bottomRegionD,
  computeLayout,
  lineD,
  tearEdges,
  topRegionD,
  yRange,
} from "./tear-geometry";
import { tearState } from "./tear-state";
import { useI18n } from "@/i18n/provider";

const TearMark = dynamic(() => import("@/components/three/tear-mark"), { ssr: false });

type Half = "top" | "bottom";

/**
 * A palavra num SVG de viewBox fixo: escala idêntica em qualquer tela e casa com a geometria do rasgo.
 * textLength estica/aperta o espaçamento para a palavra de qualquer idioma (FORCE, FORÇA) ocupar a mesma caixa, então
 * viewBox, clip-paths e o caminho do rasgo valem para todas.
 */
function Word({ text }: { text: string }) {
  return (
    <svg className="tear-word" viewBox={`0 0 ${WORD.vbW} ${WORD.vbH}`} aria-hidden>
      <text
        x="0"
        y={WORD.baseline}
        textLength={WORD.vbW}
        lengthAdjust="spacing"
        fontSize={WORD.fontSize}
        fontWeight={900}
        fill="#F2F2F2"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        {text}
      </text>
    </svg>
  );
}

/**
 * Uma metade = cópia da folha inteira (papel + grão + palavra), recortada pelo rasgo.
 * .tear-half recebe só transform/opacity (GSAP); o clip e os filtros ficam em filhos estáticos.
 */
function Sheet({ half }: { half: Half }) {
  const { t } = useI18n();
  return (
    <div className="tear-half" data-half={half}>
      {/* Sombra projetada do lado do vão (fora do clip, para cair sobre a camada de baixo) */}
      <svg className="tear-svg tear-shadow" aria-hidden>
        <path data-role="shadow" filter="url(#tear-shadow-blur)" fill="rgba(0,0,18,0.7)" />
      </svg>

      <div className="tear-paper" data-role="paper">
        <div className="tear-content">
          <div className="tear-word-wrap">
            {half === "top" && (
              <p className="tear-label" data-role="label">
                {t("tear.label")}
              </p>
            )}
            <Word text={t("tear.word")} />
          </div>
        </div>
        <div className="tear-grain" />

        {/* Borda de papel rasgado: oclusão perto do corte + faixa creme com fibras (filtro estático) */}
        <svg className="tear-svg" aria-hidden>
          <path data-role="ao" fill="none" stroke="rgba(0,0,18,0.32)" filter="url(#tear-ao-blur)" />
          <g className="tear-band" data-role="band" filter={`url(#tear-fray-${half})`}>
            <path data-role="band-shade" fill="none" stroke="#8E87B0" strokeOpacity={0.75} />
            <path data-role="band-fiber" fill="none" stroke="#E9E2D6" />
            <path data-role="band-core" fill="none" stroke="#FFFDF8" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export function TearSection({ enable3D }: { enable3D: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useI18n();

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px)",
          touch: "(pointer: coarse)",
        },
        (ctx) => {
          const { motion, touch } = ctx.conditions as { motion: boolean; mobile: boolean; touch: boolean };
          // Reduced motion: sem timeline; o CSS já mostra o estado final (sem metades, sem pin)
          if (!motion) return;

          const layer = q(".tear-halves")[0] as HTMLElement;
          const [top, bottom] = [q('[data-half="top"]')[0], q('[data-half="bottom"]')[0]] as HTMLElement[];
          const halves = [top, bottom];
          const drawLines = [...section.querySelectorAll<SVGPathElement>("[data-role=draw]")];
          const drawCore = section.querySelector<SVGPathElement>("[data-role=draw][data-core]")!;
          const dot = section.querySelector<SVGGElement>("[data-role=dot]")!;
          const geom = { H: 0, len: 0 };

          // --- geometria: calculada no mount e a cada resize; nada disso é animado -----------------------------
          const layout = () => {
            const W = layer.clientWidth;
            const H = layer.clientHeight;
            // Sem layout ainda (ex.: CSS chegando depois da hidratação no dev): espera o próximo resize/refresh
            if (W < 1 || H < 1) return;
            const content = q(".tear-content")[0] as HTMLElement;
            const mx = content.offsetLeft;
            const my = content.offsetTop;
            const L = computeLayout(W, H, mx, my);
            const { a, b } = tearEdges(L);
            const elW = W + 2 * mx;
            const elH = H + 2 * my;
            const band = Math.min(5.5, Math.max(2.5, W / 300));

            // Regiões dos filtros só em volta do rasgo (custo de raster menor)
            const ra = yRange(a);
            const setRegion = (id: string, x: number, y: number, w: number, h: number) => {
              const el = section.querySelector<SVGFilterElement>(`#${id}`);
              el?.setAttribute("x", String(x));
              el?.setAttribute("y", String(y));
              el?.setAttribute("width", String(w));
              el?.setAttribute("height", String(h));
            };
            setRegion("tear-fray-top", 0, ra.min + my - 60, elW, ra.max - ra.min + 120);
            setRegion("tear-fray-bottom", 0, ra.min + my - 60, elW, ra.max - ra.min + 120);
            setRegion("tear-ao-blur", 0, ra.min + my - 90, elW, ra.max - ra.min + 180);
            setRegion("tear-shadow-blur", 0, ra.min + my - 140, elW, ra.max - ra.min + 280);
            setRegion("tear-leak-blur", 0, ra.min - 80, W, ra.max - ra.min + 160);
            setRegion("tear-draw-glow", -20, ra.min - 60, W + 40, ra.max - ra.min + 120);
            // Fibras mais leves em telas pequenas
            section
              .querySelectorAll("[data-fibers]")
              .forEach((t) => t.setAttribute("numOctaves", W < 768 ? "1" : "2"));
            section
              .querySelectorAll("[data-displace]")
              .forEach((d) => d.setAttribute("scale", String(band * 1.6)));

            const regions: Record<Half, string> = {
              top: topRegionD(a, mx, my),
              bottom: bottomRegionD(b, mx, my, elH),
            };
            for (const h of ["top", "bottom"] as Half[]) {
              const el = h === "top" ? top : bottom;
              const edge = lineD(h === "top" ? a : b, mx, my);
              const paper = el.querySelector<HTMLElement>("[data-role=paper]")!;
              paper.style.clipPath = `path("${regions[h]}")`;
              paper.style.setProperty("-webkit-clip-path", `path("${regions[h]}")`);

              const shadow = el.querySelector("[data-role=shadow]")!;
              shadow.setAttribute("d", regions[h]);
              shadow.setAttribute("transform", `translate(0 ${h === "top" ? 10 : -10})`);

              const set = (role: string, width: number) => {
                const p = el.querySelector(`[data-role=${role}]`)!;
                p.setAttribute("d", edge);
                p.setAttribute("stroke-width", String(width));
              };
              set("ao", band * 5);
              set("band-shade", (band + 3) * 2);
              set("band-fiber", band * 2);
              set("band-core", band * 0.8);
            }

            const viewLine = lineD(a);
            q("[data-role=draw], [data-role=leak]").forEach((p) => p.setAttribute("d", viewLine));
            section.querySelector("[data-role=leak][data-core]")?.setAttribute("stroke-width", String(band * 0.9));
            section.querySelector("[data-role=leak]:not([data-core])")?.setAttribute("stroke-width", String(band * 4));

            geom.H = H;
            geom.len = drawCore.getTotalLength();
            dot.setAttribute("transform", `translate(${a[0].x} ${a[0].y})`);
          };

          layout();
          // Refaz a geometria antes de cada refresh do ScrollTrigger (load, fontes, resize)
          ScrollTrigger.addEventListener("refreshInit", layout);
          let raf = 0;
          const ro = new ResizeObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
              layout();
              ScrollTrigger.refresh();
            });
          });
          ro.observe(layer);

          // --- timeline ------------------------------------------------------------------------------------
          const phrase = q(".tear-phrase")[0] as HTMLElement;
          const split = SplitText.create(phrase, { type: "words", mask: "words" });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              // Toque: uma passada basta. Ao soltar o dedo dentro da seção, o snap direcional leva a página até o
              // fim da abertura (ou de volta ao início, se o gesto foi para cima); scrub curto para responder rápido
              scrub: touch ? 0.4 : 1,
              snap: touch
                ? { snapTo: [0, 1], directional: true, inertia: false, delay: 0.05, duration: { min: 0.7, max: 1.3 }, ease: "power2.inOut" }
                : undefined,
              invalidateOnRefresh: true,
              // Camadas próprias só enquanto a seção está ativa
              onToggle: (self) => halves.forEach((h) => (h.style.willChange = self.isActive ? "transform" : "")),
            },
          });

          tl.addLabel("hold", 0)
            .addLabel("draw", 1.1)
            .addLabel("crack", 3.4)
            .addLabel("tear", 4.2)
            .addLabel("reveal", 6.1)
            .addLabel("phrase", 7.9)
            .addLabel("end", 9.1);

          // 1. hold: palavra parada, texto pequeno com parallax leve (até o rasgo)
          tl.fromTo(q("[data-role=label]"), { yPercent: 0 }, { yPercent: -70, duration: 4.2 }, "hold");

          // 2. draw: linha corre da esquerda para a direita, com o ponto brilhante na ponta
          tl.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, "draw");
          tl.fromTo(
            drawLines,
            { drawSVG: "0% 0%" },
            {
              drawSVG: "0% 100%",
              duration: 2.3,
              ease: "dfDraw",
              onUpdate(this: gsap.core.Tween) {
                if (!geom.len) return;
                const p = drawCore.getPointAtLength(this.ratio * geom.len);
                dot.setAttribute("transform", `translate(${p.x} ${p.y})`);
              },
            },
            "draw",
          );

          // 3. crack: a linha some e abre uma fresta fina com luz roxa vazando de baixo
          tl.to([...drawLines, dot], { autoAlpha: 0, duration: 0.5 }, "crack");
          tl.fromTo(q("[data-role=leak]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, "crack");
          tl.fromTo(top, { y: 0 }, { y: -4, duration: 0.7, ease: "power2.out" }, "crack");
          tl.fromTo(bottom, { y: 0 }, { y: 4, duration: 0.7, ease: "power2.out" }, "crack");
          // Bordas creme entram aos poucos: fio fino na fresta, faixa inteira só quando o papel abre
          tl.fromTo(q("[data-role=band]"), { autoAlpha: 0 }, { autoAlpha: 0.45, duration: 0.6 }, "crack+=0.1");
          tl.fromTo(q("[data-role=ao]"), { autoAlpha: 0 }, { autoAlpha: 0.6, duration: 0.6 }, "crack+=0.1");

          // 4. tear: metades se separam com perspectiva e rotação oposta
          tl.to(q("[data-role=band]"), { autoAlpha: 1, duration: 0.6 }, "tear");
          tl.to(q("[data-role=ao]"), { autoAlpha: 1, duration: 0.6 }, "tear");
          // Sombra só quando o vão abre (na fresta ela apagaria a luz que vaza)
          tl.fromTo(q(".tear-shadow"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, "tear");
          tl.to(
            top,
            { y: () => -geom.H * 0.26, rotation: -2.4, rotationX: 9, transformPerspective: 1400, duration: 1.9, ease: "dfTear" },
            "tear",
          );
          tl.to(
            bottom,
            { y: () => geom.H * 0.26, rotation: 2, rotationX: -9, transformPerspective: 1400, duration: 1.9, ease: "dfTear" },
            "tear",
          );
          tl.to(q("[data-role=leak]"), { autoAlpha: 0, duration: 1.6 }, "tear+=0.6");
          tl.fromTo(q(".tear-under-glow"), { autoAlpha: 0.55, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 3, ease: "dfSoft" }, "tear");

          // 5. reveal: metades saem da viewport; "df" escala e dá meia-volta; logotipo entra
          tl.to(top, { y: () => -(geom.H * 0.78 + 80), rotation: -4, rotationX: 16, duration: 1.8, ease: "power2.in" }, "reveal");
          tl.to(bottom, { y: () => geom.H * 0.78 + 80, rotation: 3.5, rotationX: -16, duration: 1.8, ease: "power2.in" }, "reveal");
          tl.fromTo(q(".tear-mark-box"), { scale: 0.85 }, { scale: 1, duration: 3.6, ease: "dfSoft" }, "tear+=0.4");
          tl.fromTo(tearState, { reveal: 0 }, { reveal: 1, duration: 3.6, ease: "dfSoft" }, "tear+=0.4");
          tl.fromTo(q(".tear-logo"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: "dfSoft" }, "reveal+=1.1");

          // 6. phrase: palavras sobem de trás de uma máscara
          tl.from(split.words, { yPercent: 115, duration: 0.9, stagger: 0.12, ease: "power3.out" }, "phrase");

          // 7. estado final estável antes de soltar
          tl.to({}, { duration: 0.9 }, "end");

          return () => {
            ro.disconnect();
            ScrollTrigger.removeEventListener("refreshInit", layout);
            cancelAnimationFrame(raf);
            tearState.reveal = 1;
          };
        },
        section,
      );

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="sobre" className="tear" aria-labelledby="tear-title">
      <h2 id="tear-title" className="sr-only">
        {t("tear.srTitle")}
      </h2>

      {/* Filtros estáticos (nunca animados); regiões ajustadas no layout */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          {(["top", "bottom"] as Half[]).map((h, i) => (
            <filter
              key={h}
              id={`tear-fray-${h}`}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              {/* Fibras: alta frequência, esticada na vertical (fios perpendiculares ao corte) */}
              <feTurbulence data-fibers type="fractalNoise" baseFrequency="0.55 0.07" numOctaves={2} seed={11 + i} result="fibers" />
              {/* Segundo nível: variação lenta da largura da faixa ao longo do rasgo */}
              <feTurbulence type="fractalNoise" baseFrequency="0.009 0.04" numOctaves={1} seed={4 + i} result="width" />
              <feComposite in="fibers" in2="width" operator="arithmetic" k1={0} k2={0.55} k3={0.85} k4={-0.2} result="mix" />
              <feDisplacementMap data-displace in="SourceGraphic" in2="mix" scale={7} xChannelSelector="R" yChannelSelector="G" result="d" />
              <feGaussianBlur in="d" stdDeviation={0.35} />
            </filter>
          ))}
          <filter id="tear-ao-blur" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation={8} />
          </filter>
          <filter id="tear-shadow-blur" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation={14} />
          </filter>
          <filter id="tear-leak-blur" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation={7} />
          </filter>
          <filter id="tear-draw-glow" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation={3.5} />
          </filter>
        </defs>
      </svg>

      {/* Camada de baixo (z 1, abaixo do canvas 3D): o que o rasgo revela */}
      <div className="tear-under">
        <div className="tear-under-glow" />
        <svg className="tear-svg" aria-hidden>
          <path data-role="leak" fill="none" stroke="#9C8CFF" filter="url(#tear-leak-blur)" />
          <path data-role="leak" data-core fill="none" stroke="#EEEAFF" />
        </svg>
        <div className="tear-reveal">
          <div className="tear-mark-box">
            {enable3D ? (
              <TearMark className="absolute inset-0" />
            ) : (
              <Image
                src="/assets/logo/df-monogram-branco.svg"
                alt=""
                width={220}
                height={186}
                className="absolute inset-0 m-auto h-auto w-[62%]"
              />
            )}
          </div>
          <Image
            src="/assets/logo/digitforce-horizontal-branco.svg"
            alt="Digit Force"
            width={300}
            height={68}
            className="tear-logo"
          />
          <p className="tear-phrase">{t("tear.phrase")}</p>
        </div>
      </div>

      {/* Camada das metades (z 10, acima do canvas): a folha que rasga */}
      <div className="tear-halves" aria-hidden>
        <Sheet half="bottom" />
        <Sheet half="top" />
        <svg className="tear-svg" aria-hidden>
          <path data-role="draw" fill="none" stroke="#A89CF0" strokeWidth={7} strokeOpacity={0.55} filter="url(#tear-draw-glow)" />
          <path data-role="draw" data-core fill="none" stroke="#E4DEFF" strokeWidth={1.6} strokeLinecap="round" />
          <g data-role="dot">
            <circle r={11} fill="#A89CF0" opacity={0.55} filter="url(#tear-draw-glow)" />
            <circle r={2.8} fill="#FFFFFF" />
          </g>
        </svg>
      </div>
    </section>
  );
}
