"use client";

import { useRef, useState } from "react";
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
import { AthpaceVideo } from "@/components/athpace-video";
import { AthpaceStats } from "@/components/sections/athpace-stats";

import { useEnable3D } from "@/components/three/use-enable-3d";
import { useWebGL } from "@/components/three/use-webgl";
import { CanvasBoundary } from "@/components/three/canvas-boundary";
import { Hero } from "@/components/hero/hero";
import type { ProductKind } from "@/components/three/product-model";

// Um único <Canvas> fixo; as seções só renderizam <View>s que desenham nele
const SceneCanvas = dynamic(() => import("@/components/three/scene-canvas"), { ssr: false });
const ManifestoRing = dynamic(() => import("@/components/three/manifesto-ring"), { ssr: false });
const ProductModel = dynamic(() => import("@/components/three/product-model"), { ssr: false });

// TODO: trocar pelo WhatsApp e e-mail reais do Mateus
const WHATSAPP = "https://wa.me/55XXXXXXXXXXX";
const EMAIL = "contato@digitforce.com.br";

const A = "/assets";

const nav: { href: `#${string}`; label: string }[] = [
  { href: "#solucoes", label: "Soluções" },
  { href: "#produtos", label: "Produtos" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
];

const athpaceHighlights = [
  {
    icon: Languages,
    title: "Multilíngue",
    text: "Entende e responde o hóspede no idioma dele. A barreira de idioma deixa de existir.",
  },
  {
    icon: BellRing,
    title: "Chamados automáticos",
    text: "Pedidos por voz viram chamados para a equipe certa, sem ligar para a recepção.",
  },
  {
    icon: ShieldCheck,
    title: "Dados no servidor local",
    text: "Informações do hóspede e do hotel ficam em servidor local, com criptografia de ponta a ponta.",
  },
];

const products: { id: ProductKind; title: string; text: string; img: string; videoHref?: string }[] = [
  {
    id: "interfones",
    title: "Interfonia digital 2 fios",
    text: "Monitor interno e unidade externa com vídeo, sobre a fiação existente. Ideal para retrofit sem quebra-quebra.",
    img: `${A}/produtos/interfone/unidade-externa-frente.webp`,
  },
  {
    id: "elevadores",
    title: "Emergência para elevadores",
    text: "Comunicação da cabine com a central, gateway para casa de máquinas e monitoramento remoto.",
    img: `${A}/produtos/elevador/intercomunicador-cabine-a.webp`,
  },
  {
    id: "athpace",
    title: "Athpace: IA para hotelaria",
    text: "Assistente de voz multilíngue no quarto, integrado ao PMS, com dados em servidor local.",
    img: `${A}/produtos/interfone/monitor-interno-frente-tela-ligada.webp`, // TODO: trocar pela foto do speaker Athpace
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

export default function Home() {
  // O canvas global existe sempre que há WebGL (o globo do hero roda também no mobile e em reduced motion).
  // As demais cenas 3D seguem só em >= 768px e sem reduced motion; fora disso, imagens estáticas.
  const webglSupported = useWebGL();
  const [glFailed, setGlFailed] = useState(false);
  const webgl = webglSupported && !glFailed;
  const enable3D = useEnable3D() && webgl;
  const manifestoRef = useRef<HTMLElement>(null);

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
      <Hero
        webgl={webgl}
        globeMode={enable3D ? "view" : "canvas"}
        onGlError={() => setGlFailed(true)}
        cta={<CtaButton>Falar com um especialista</CtaButton>}
      />

      {/* 2. RASGO (#sobre): FORÇA rasga e revela o "df" + frase */}
      <TearSection enable3D={enable3D} />

      {/* 3. NÚMEROS E PILARES (faixa compacta) */}
      <ProofStrip />

      {/* 4. INTEGRAÇÕES: cards em órbita guiada pelo scroll, "df" no centro */}
      <IntegrationsOrbit enable3D={enable3D} />

      {/* 5. PRODUTOS */}
      <section id="produtos" className="py-20">
        <Container>
          <h2 className="text-3xl font-semibold md:text-4xl">
            Três linhas, <span className="df-gradient-text">um só ecossistema</span>
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
              IA que entende <span className="df-gradient-text block">cada hóspede</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-balance text-[var(--muted-foreground)]">
              Controle do quarto por voz, pedidos sem ligar para a recepção e zero barreira de idioma.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <AthpaceVideo />
          </div>

          <AthpaceStats />

          <ul className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
            {athpaceHighlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--df-purple-light)]">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 6. MANIFESTO (anel com o "df") */}
      <section ref={manifestoRef} className="py-20">
        <Container className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="max-w-md text-balance text-3xl font-semibold leading-tight md:text-4xl">
              Uma força digital construída <span className="df-gradient-text">para impulsionar o futuro</span>
            </h2>
            <p className="mt-4 max-w-md text-sm text-[var(--muted-foreground)]">
              Acreditamos que tecnologia precisa empoderar, simplificar, proteger e evoluir junto com o mundo.
            </p>
          </div>
          <div className="relative mx-auto flex h-80 w-80 items-center justify-center">
            <div className="df-glow absolute inset-0" />
            {enable3D ? (
              <ManifestoRing className="absolute inset-0" sectionRef={manifestoRef} />
            ) : (
              <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-[var(--border)]">
                <Image src={`${A}/logo/df-monogram-roxo.svg`} alt="" width={120} height={101} />
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* 7. CTA */}
      <section id="contato" className="py-20">
        <Container>
          <div className="glass-subtle overflow-hidden rounded-3xl px-6 py-20 text-center">
            <BackgroundBeams />
            <div className="relative z-10">
              <h2 className="text-3xl font-semibold md:text-4xl">
                Seja um parceiro <span className="df-gradient-text">Digit Force</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm text-[var(--muted-foreground)]">
                Integradores, construtoras e hotéis: fale com nosso time e monte o projeto certo para o seu cliente.
              </p>
              <div className="mt-8 flex justify-center">
                <CtaButton>Chamar no WhatsApp</CtaButton>
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
              Soluções inteligentes para segurança, controle de acesso e hotelaria.
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
    </main>
  );
}

function ProductCard({ product: p, enable3D }: { product: (typeof products)[number]; enable3D: boolean }) {
  const cardRef = useRef<HTMLElement>(null);

  return (
    <article ref={cardRef} id={`produto-${p.id}`} className="glass flex flex-col overflow-hidden rounded-2xl p-6">
      <div className="relative flex h-56 items-center justify-center">
        <div className="df-glow absolute h-40 w-40" />
        {enable3D ? (
          // O View passa da borda de cima do card para o modelo poder escapar dela (o canvas não é cortado pelo overflow)
          <ProductModel kind={p.id} hoverRef={cardRef} className="absolute -inset-x-6 -top-16 bottom-0" />
        ) : (
          <Image src={p.img} alt={p.title} width={260} height={260} className="relative max-h-52 w-auto object-contain" />
        )}
      </div>
      <h3 className="mt-6 text-lg font-semibold">{p.title}</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{p.text}</p>
      {p.videoHref && (
        <a
          href={p.videoHref}
          className="glass mt-5 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors hover:text-white"
        >
          <PlayCircle className="h-4 w-4 text-[var(--df-purple-light)]" />
          Ver vídeo
        </a>
      )}
    </article>
  );
}
