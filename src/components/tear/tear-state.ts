/**
 * Estado compartilhado entre a timeline do rasgo (GSAP, DOM) e a cena 3D do "df" (useFrame, canvas global).
 * Objeto mutável de propósito: a timeline anima `reveal` e o useFrame só lê, sem re-render do React.
 * Começa em 1 (estado final) para o caso de a timeline não existir (reduced motion).
 */
export const tearState = { reveal: 1 };
