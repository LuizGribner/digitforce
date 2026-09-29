"use client";

import { useSyncExternalStore } from "react";

// 3D só em telas >= 768px e sem prefers-reduced-motion; fora disso a página mostra as imagens estáticas
const QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

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
