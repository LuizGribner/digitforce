"use client";

import { useEffect } from "react";

type NavigatorWithUAData = Navigator & { userAgentData?: { brands?: { brand: string }[] } };

/**
 * Filtro SVG da refração do liquid glass + detecção de suporte.
 *
 * `backdrop-filter: url(#...)` só funciona no Chromium. No Safari a regra é aceita pelo parser (então @supports
 * não serve para detectar), mas o filtro inteiro deixa de ser aplicado e o vidro perde até o blur. Por isso a
 * refração só liga com a classe html.glass-refraction, adicionada aqui apenas quando o navegador é Chromium.
 */
export function GlassFilter() {
  useEffect(() => {
    const brands = (navigator as NavigatorWithUAData).userAgentData?.brands ?? [];
    if (!brands.some((b) => b.brand === "Chromium")) return;
    // Celular/tablet e máquinas fracas: o displacement no backdrop pesa na rolagem; fica o blur normal
    if (matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency || 4) <= 4) return;
    const root = document.documentElement;
    root.classList.add("glass-refraction");
    return () => root.classList.remove("glass-refraction");
  }, []);

  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <filter id="df-glass-refraction" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        {/* Ruído grande e suavizado desloca o que está atrás do vidro, como uma lâmina com ondulação */}
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="smoothNoise" />
        <feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="16" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
