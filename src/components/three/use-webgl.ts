"use client";

import { useSyncExternalStore } from "react";

let supported: boolean | null = null;

function detect() {
  if (supported !== null) return supported;
  try {
    const canvas = document.createElement("canvas");
    supported = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    supported = false;
  }
  return supported;
}

const noop = () => () => {};

/** WebGL disponível no navegador (checado uma vez). No HTML estático é false: sai o fallback. */
export function useWebGL() {
  return useSyncExternalStore(noop, detect, () => false);
}
