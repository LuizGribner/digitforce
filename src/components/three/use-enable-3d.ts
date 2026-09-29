"use client";

import { useSyncExternalStore } from "react";

// Cenas 3D no canvas fixo só em telas >= 768px, sem prefers-reduced-motion e com ponteiro fino (mouse/trackpad).
// No toque a rolagem roda fora da thread do JS e tudo que é desenhado num canvas fixo fica um frame atrás da página
// (os objetos "pulam" ao rolar); lá ficam as imagens estáticas e o globo do hero usa um canvas embutido.
const QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference) and (pointer: fine)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

export function useEnable3D() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    // No export estático o HTML sai com as imagens; o 3D entra depois da hidratação
    () => false,
  );
}
