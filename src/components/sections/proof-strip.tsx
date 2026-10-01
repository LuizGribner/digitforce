"use client";

import { useRef } from "react";
import { Cpu, Globe, Headset } from "lucide-react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

import { useI18n } from "@/i18n/provider";

// Ícones na ordem dos pilares do dicionário (pillars.items)
const icons = [Cpu, Headset, Globe];

/** Pilares logo depois do rasgo: faixa compacta em linha, sem card em volta (os números foram para o Athpace). */
export function ProofStrip() {
  const root = useRef<HTMLElement>(null);
  const { dict } = useI18n();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", root.current);
        gsap.set(items, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(items, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", overwrite: true }),
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label={dict.pillars.label} className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {dict.pillars.items.map(({ title, text }, i) => {
            const Icon = icons[i];
            return (
              <div key={title} data-reveal className="flex gap-4">
                <span className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--df-purple-light)]">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
