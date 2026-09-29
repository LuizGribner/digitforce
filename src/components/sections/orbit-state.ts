/**
 * Estado compartilhado entre a órbita de integrações (GSAP, DOM) e o "df" 3D do centro (useFrame).
 * reveal: 0 com os cards empilhados, 1 com a órbita aberta (o "df" cresce junto com o texto).
 * flash: brilho curto quando a linha de luz de um card chega ao centro (decai para 0).
 * Começa no estado final, para o caso de a timeline não existir (reduced motion).
 */
export const orbitState = { reveal: 1, flash: 0 };
