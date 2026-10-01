"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  BellRing,
  Languages,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { ShimmerButton } from "@/components/ui/shimmer-button";

import { SiteHeader } from "@/components/site-header";
import { TearSection } from "@/components/tear/tear-section";
import { ProofStrip } from "@/components/sections/proof-strip";
import { IntegrationsOrbit } from "@/components/sections/integrations-orbit";
import { Manifesto } from "@/components/sections/manifesto";
import { HeroStatic, OrbitStatic, TearStatic } from "@/components/sections/static-fallbacks";
import { SectionBoundary } from "@/components/section-boundary";
import { AthpaceVideo, type SubtitleTrack } from "@/components/athpace-video";
import { AthpaceStats } from "@/components/sections/athpace-stats";

import { useEnable3D } from "@/components/three/use-enable-3d";
import { useWebGL } from "@/components/three/use-webgl";
import { CanvasBoundary } from "@/components/three/canvas-boundary";
import { Hero } from "@/components/hero/hero";
import type { ProductKind } from "@/components/three/product-model";
import { LocaleSuggestion } from "@/components/locale-suggestion";
import { getLenis } from "@/components/providers/smooth-scroll";
import { takeRestoreTarget } from "@/i18n/navigation";
import { useI18n } from "@/i18n/provider";

// Um único <Canvas> fixo; as seções só renderizam <View>s que desenham nele
const SceneCanvas = dynamic(() => import("@/components/three/scene-canvas"), { ssr: false });
const ProductModel = dynamic(() => import("@/components/three/product-model"), { ssr: false });

// TODO: trocar pelo WhatsApp e e-mail reais do Mateus
const WHATSAPP = "https://wa.me/55XXXXXXXXXXX";
const EMAIL = "contato@digitforce.com.br";

const A = "/assets";

type NavItem = { href: `#${string}`; label: string };

// Ícones na ordem de athpace.highlights do dicionário
const highlightIcons = [Languages, BellRing, ShieldCheck];

const products: { id: ProductKind; img: string; videoHref?: string }[] = [
  { id: "interfones", img: `${A}/produtos/interfone/unidade-externa-frente-sm.webp` },
  { id: "elevadores", img: `${A}/produtos/elevador/intercomunicador-cabine-a-sm.webp` },
  {
    id: "athpace",
    img: `${A}/produtos/interfone/monitor-interno-frente-tela-ligada-sm.webp`, // TODO: trocar pela foto do speaker Athpace
    videoHref: "#athpace",
  },
];

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>;
}

function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <ShimmerButton
      background="#5749A5"
      shimmerColor="#F2F2F2"
      className="px-7 py-3 text-sm font-semibold"
      onClick={() => window.open(WHATSAPP, "_blank", "noopener")}
    >
      {children}
    </ShimmerButton>
  );
}

/**
 * Depois de trocar de idioma (navigation.ts), volta para a mesma seção em vez do topo. Um frame depois do mount, para
 * o Lenis (criado no efeito do provider, que roda depois deste) já existir.
 */
function useRestoreLocalePosition() {
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const y = takeRestoreTarget();
      if (y === null) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    });
    return () => cancelAnimationFrame(raf);
  }, []);
}

export function HomePage({ subtitles }: { subtitles: SubtitleTrack[] }) {
  const { dict, t } = useI18n();
  useRestoreLocalePosition();

  // O canvas global existe sempre que há WebGL (o globo do hero roda também no mobile e em reduced motion).
  // As demais cenas 3D seguem só em >= 768px e sem reduced motion; fora disso, imagens estáticas.
  const webglSupported = useWebGL();
  const [glFailed, setGlFailed] = useState(false);
  const webgl = webglSupported && !glFailed;
  const enable3D = useEnable3D() && webgl;

  const nav: NavItem[] = [
    { href: "#solucoes", label: t("nav.solutions") },
    { href: "#produtos", label: t("nav.products") },
    { href: "#sobre", label: t("nav.about") },
    { href: "#contato", label: t("nav.contact") },
  ];

  return (
    <main className="relative overflow-x-clip">
      {/* Canvas fixo só quando há cenas nele (mouse). No toque o globo do hero usa um canvas embutido */}
      {enable3D && (
        <CanvasBoundary onError={() => setGlFailed(true)}>
          <SceneCanvas />
        </CanvasBoundary>
      )}

      {/* HEADER fixo: pílula de vidro sempre visível (grande no topo, compacta ao rolar) */}
      <SiteHeader nav={nav} contactHref={WHATSAPP} />

      {/* 1. HERO: globo-circuito 3D interativo com o chip */}
      <SectionBoundary name="hero" fallback={<HeroStatic cta={<CtaButton>{t("hero.cta")}</CtaButton>} />}>
        <Hero
          webgl={webgl}
          globeMode={enable3D ? "view" : "canvas"}
          onGlError={() => setGlFailed(true)}
          cta={<CtaButton>{t("hero.cta")}</CtaButton>}
        />
      </SectionBoundary>

      {/* 2. RASGO (#sobre): FORCE/FORÇA rasga e revela o "df" + frase */}
      <SectionBoundary name="rasgo" fallback={<TearStatic />}>
        <TearSection enable3D={enable3D} />
      </SectionBoundary>

      {/* 3. NÚMEROS E PILARES (faixa compacta) */}
      <ProofStrip />

      {/* 4. INTEGRAÇÕES: cards em órbita guiada pelo scroll, "df" no centro */}
      <SectionBoundary name="integrações" fallback={<OrbitStatic />}>
        <IntegrationsOrbit enable3D={enable3D} />
      </SectionBoundary>

      {/* 5. PRODUTOS */}
      <section id="produtos" className="py-20">
        <Container>
          <h2 className="text-3xl font-semibold md:text-4xl">
            {t("products.titleA")} <span className="df-gradient-text">{t("products.titleB")}</span>
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} enable3D={enable3D} />
            ))}
          </div>
        </Container>
      </section>

      {/* 5b. ATHPACE (vídeo) */}
      <section id="athpace" className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--df-purple-light)]" />
              Athpace
            </span>
            <h2 className="mt-5 text-3xl font-semibold leading-tight md:text-5xl">
              {t("athpace.titleA")} <span className="df-gradient-text block">{t("athpace.titleB")}</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-balance text-[var(--muted-foreground)]">
              {t("athpace.lead")}
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <AthpaceVideo subtitles={subtitles} />
          </div>

          <AthpaceStats />

          <ul className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
            {dict.athpace.highlights.map(({ title, text }, i) => {
              const Icon = highlightIcons[i];
              return (
                <li key={title} className="flex gap-4">
                  <span className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--df-purple-light)]">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* 6. MANIFESTO (anel com o "df") */}
      <SectionBoundary name="manifesto" fallback={<Manifesto enable3D={false} />}>
        <Manifesto enable3D={enable3D} />
      </SectionBoundary>

      {/* 7. CTA */}
      <section id="contato" className="py-20">
        <Container>
          <div className="glass-subtle overflow-hidden rounded-3xl px-6 py-20 text-center">
            <BackgroundBeams />
            <div className="relative z-10">
              <h2 className="text-3xl font-semibold md:text-4xl">
                {t("cta.titleA")} <span className="df-gradient-text">{t("cta.titleB")}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm text-[var(--muted-foreground)]">
                {t("cta.text")}
              </p>
              <div className="mt-8 flex justify-center">
                <CtaButton>{t("cta.button")}</CtaButton>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 8. RODAPÉ */}
      <footer className="border-t border-[var(--border)]">
        <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
          <div>
            <Image src={`${A}/logo/digitforce-horizontal-branco.svg`} alt="Digit Force" width={140} height={32} />
            <p className="mt-3 max-w-xs text-xs text-[var(--muted-foreground)]">
              {t("footer.tagline")}
            </p>
          </div>
          <nav className="flex gap-8 text-sm text-[var(--muted-foreground)]">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-white">
                {n.label}
              </a>
            ))}
          </nav>
          <a href={`mailto:${EMAIL}`} className="text-sm text-[var(--muted-foreground)] hover:text-white">
            {EMAIL}
          </a>
        </Container>
        <Container className="pb-8 text-xs text-[var(--muted-foreground)]">© 2026 Digit Force</Container>
      </footer>

      <LocaleSuggestion />
    </main>
  );
}

function ProductCard({ product: p, enable3D }: { product: (typeof products)[number]; enable3D: boolean }) {
  const cardRef = useRef<HTMLElement>(null);
  const { dict, t } = useI18n();
  const { title, text } = dict.products.items[p.id];

  return (
    <article ref={cardRef} id={`produto-${p.id}`} className="glass flex flex-col overflow-hidden rounded-2xl p-6">
      <div className="relative flex h-56 items-center justify-center">
        <div className="df-glow absolute h-40 w-40" />
        {enable3D ? (
          // O View passa da borda de cima do card para o modelo poder escapar dela (o canvas não é cortado pelo overflow)
          <ProductModel kind={p.id} hoverRef={cardRef} className="absolute -inset-x-6 -top-16 bottom-0" />
        ) : (
          <Image src={p.img} alt={title} width={260} height={260} className="relative max-h-52 w-auto object-contain" />
        )}
      </div>
      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{text}</p>
      {p.videoHref && (
        <a
          href={p.videoHref}
          className="glass mt-5 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors hover:text-white"
        >
          <PlayCircle className="h-4 w-4 text-[var(--df-purple-light)]" />
          {t("products.watchVideo")}
        </a>
      )}
    </article>
  );
}
