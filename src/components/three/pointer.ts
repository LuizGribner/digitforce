import type { RootState } from "@react-three/fiber";

// Dentro de um <View> o state é de um portal, com pointer próprio que só atualiza sobre o div do View.
// O canvas raiz escuta o body (eventSource), então o pointer dele cobre a janela inteira.
export function getRootState(state: RootState): RootState {
  let root = state;
  while (root.previousRoot) root = root.previousRoot.getState();
  return root;
}

/** Pointer normalizado (-1..1) em relação à janela. */
export function getWindowPointer(state: RootState) {
  return getRootState(state).pointer;
}

/**
 * Pointer normalizado (-1..1) em relação a um elemento do DOM, ou null se o cursor está fora dele
 * (ou ainda não se moveu).
 */
export function getElementPointer(state: RootState, element: HTMLElement | null) {
  const root = getRootState(state);
  if (!element || !root.internal.lastEvent.current) return null;

  const clientX = ((root.pointer.x + 1) / 2) * root.size.width;
  const clientY = ((1 - root.pointer.y) / 2) * root.size.height;
  const rect = element.getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;

  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -(((clientY - rect.top) / rect.height) * 2 - 1),
  };
}
