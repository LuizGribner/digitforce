"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

const ManifestoRing = dynamic(() => import("@/components/three/manifesto-ring"), { ssr: false });

/** Manifesto com o anel 3D e o "df"; com enable3D false (ou como fallback de erro) mostra o anel estático. */
export function Manifesto({ enable3D }: { enable3D: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
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
            <ManifestoRing className="absolute inset-0" sectionRef={sectionRef} />
          ) : (
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-[var(--border)]">
              <Image src="/assets/logo/df-monogram-roxo.svg" alt="" width={120} height={101} className="h-auto" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
