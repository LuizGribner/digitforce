"use client";

import type { ReactNode } from "react";
import Image from "next/image";

import { useI18n } from "@/i18n/provider";
import { CARDS } from "./integrations-orbit";

/**
 * Versões estáticas das seções animadas, usadas pelo SectionBoundary quando uma delas quebra. Mesmo conteúdo e
 * mesmos ids (as âncoras do menu continuam funcionando), sem GSAP, sem canvas e sem pin.
 */

export function HeroStatic({ cta }: { cta: ReactNode }) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden lg:h-[100svh] lg:min-h-[680px]">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-32 lg:h-full lg:flex-row lg:items-center lg:justify-between lg:pt-10">
        <div className="lg:w-[48%]">
          <h1
            id="hero-title"
            className="text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-[clamp(3.5rem,5vw,5.25rem)]"
          >
            {t("hero.titleA")}
            <br />
            <span className="df-gradient-text">{t("hero.titleB")}</span>
          </h1>
          <p className="mt-6 max-w-md text-[var(--muted-foreground)] md:text-lg">{t("hero.lead")}</p>
          <div className="mt-9 flex">{cta}</div>
        </div>
        <div className="relative mx-auto flex aspect-square w-[min(80vw,420px)] items-center justify-center">
          <div className="df-glow absolute inset-[15%]" />
          <Image src="/assets/logo/df-monogram-branco.svg" alt="" width={220} height={186} className="relative h-auto w-[45%] opacity-90" />
        </div>
      </div>
    </section>
  );
}

export function TearStatic() {
  const { t } = useI18n();
  return (
    <section id="sobre" aria-labelledby="tear-title" className="relative overflow-hidden bg-[#000024] py-24">
      <h2 id="tear-title" className="sr-only">
        {t("tear.srTitle")}
      </h2>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_58%_52%_at_50%_44%,rgba(87,73,165,0.6),rgba(87,73,165,0.14)_48%,transparent_72%)]" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 px-6 text-center">
        <Image src="/assets/logo/df-monogram-branco.svg" alt="" width={220} height={186} className="h-auto w-40 opacity-90" />
        <Image src="/assets/logo/digitforce-horizontal-branco.svg" alt="Digit Force" width={300} height={68} className="h-auto w-[min(58vw,300px)]" />
        <p className="max-w-[30ch] text-[clamp(1.1rem,2.1vw,1.7rem)] font-medium leading-snug text-[#F2F2F2]/85">
          {t("tear.phrase")}
        </p>
      </div>
    </section>
  );
}

export function OrbitStatic() {
  const { dict, t } = useI18n();
  return (
    <section id="solucoes" aria-labelledby="orbit-title" className="py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="orbit-title" className="text-balance text-3xl font-semibold leading-tight md:text-5xl">
            {t("orbit.titleA")} <span className="df-gradient-text">{t("orbit.titleB")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-balance text-sm text-[var(--muted-foreground)] md:text-base">
            {t("orbit.subtitle")}
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CARDS.map((c) => (
            <li key={c.id} className="glass relative aspect-[3/4] overflow-hidden rounded-2xl">
              <span className="absolute inset-0 bg-[radial-gradient(closest-side_at_50%_42%,rgba(87,73,165,0.55),transparent)]" />
              <span className="absolute inset-x-[12%] bottom-[25%] top-[9%]">
                <Image src={c.img} alt="" fill sizes="220px" loading="lazy" className="object-contain" />
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#000024]/85 to-transparent px-3 pb-3 pt-10 text-center text-xs font-semibold text-[#F2F2F2]">
                {dict.orbit.cards[c.id].name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
