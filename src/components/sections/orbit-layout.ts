/**
 * Geometria da órbita de integrações (função pura, testável fora do browser).
 *
 * Zonas: o texto ocupa o topo (até `zoneTop`, que já inclui a folga de 32px abaixo do subtítulo) e nenhum card entra
 * ali, em nenhum momento. A elipse fica na faixa entre `zoneTop` e a base da viewport. O raio Y, o centro e a
 * escala geral dos cards (k) saem dessa faixa; o raio X, da largura. Se algum card cobrir mais de 15% de outro em
 * qualquer ponto do giro, a escala diminui e a conta é refeita.
 */

export const MAX_ROT = 8; // graus
export const HOVER_SCALE = 1.15;
const MARGIN = 16;
const MAX_OVERLAP = 0.15;

export type OrbitInput = {
  W: number;
  H: number;
  /** limite superior dos cards (fim do subtítulo + 32px), em px da camada */
  zoneTop: number;
  /** tamanho base do card (CSS), antes das escalas */
  cardW: number;
  cardH: number;
  n: number;
};

export type OrbitLayout = { W: number; H: number; cy: number; rx: number; ry: number; k: number; zoneTop: number; bottom: number };

export type Pose = { x: number; y: number; scale: number; rot: number; depth: number };

const DEG = Math.PI / 180;
export const depthScale = (depth: number) => 0.8 + depth * 0.25;

/** Meia largura/altura da caixa de um card escalado e rotacionado. */
export function halfExtents(w: number, h: number, rotDeg: number) {
  const c = Math.abs(Math.cos(rotDeg * DEG));
  const s = Math.abs(Math.sin(rotDeg * DEG));
  return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
}

/** Pose final (órbita) do card i, com o giro `spin`. x, y são o centro do card em px da camada. */
export function orbitPose(i: number, n: number, spin: number, L: OrbitLayout): Pose {
  const a = (i / n) * Math.PI * 2 + spin - Math.PI / 2;
  const depth = Math.sin(a);
  return {
    x: L.W / 2 + Math.cos(a) * L.rx,
    y: L.cy + depth * L.ry,
    scale: L.k * depthScale(depth),
    rot: Math.cos(a) * MAX_ROT,
    depth,
  };
}

/** Pose da pilha inicial: no centro da elipse, em leque leve. */
export function stackPose(i: number, n: number, L: OrbitLayout): Pose {
  const c = i - (n - 1) / 2;
  return { x: L.W / 2 + c * 0.01 * L.W, y: L.cy + c * 0.006 * L.H, scale: 0.6 * L.k, rot: c * 2.5, depth: 0 };
}

/** Maior escala permitida para um card centrado em y sem invadir a zona do texto nem sair pela base. */
export function maxScaleAt(y: number, cardH: number, L: OrbitLayout) {
  return Math.max(0.1, Math.min(((y - L.zoneTop) * 2) / cardH, ((L.bottom - y) * 2) / cardH));
}

function rectOf(p: Pose, cardW: number, cardH: number) {
  const { hw, hh } = halfExtents(cardW * p.scale, cardH * p.scale, p.rot);
  return { x0: p.x - hw, x1: p.x + hw, y0: p.y - hh, y1: p.y + hh, area: 4 * hw * hh };
}

/** Maior fração de um card coberta por outro, amostrando o giro entre duas posições vizinhas. */
export function maxOverlap(L: OrbitLayout, n: number, cardW: number, cardH: number, samples = 12) {
  let worst = 0;
  for (let s = 0; s < samples; s++) {
    const spin = ((Math.PI * 2) / n) * (s / samples);
    const rects = Array.from({ length: n }, (_, i) => rectOf(orbitPose(i, n, spin, L), cardW, cardH));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = rects[i];
        const b = rects[j];
        const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ix > 0 && iy > 0) worst = Math.max(worst, (ix * iy) / Math.min(a.area, b.area));
      }
    }
  }
  return worst;
}

export function solveLayout({ W, H, zoneTop, cardW, cardH, n }: OrbitInput): OrbitLayout {
  const mobile = W < 768;
  const tablet = !mobile && W < 1024;
  const bottom = H - MARGIN;
  const rxBase = (mobile ? 0.3 : tablet ? 0.38 : 0.4) * W;
  // Teto para a elipse continuar larga e achatada (rx/ry >= ~2.5 no desktop); abaixo disso decide a faixa livre
  const ryCap = Math.min((mobile ? 0.22 : 0.24) * H, mobile ? Infinity : rxBase / (tablet ? 1.8 : 2.5));
  let last: OrbitLayout | null = null;

  for (let k = 1; k >= 0.55; k -= 0.025) {
    const h = cardH * k;
    const w = cardW * k;
    const band = bottom - zoneTop;
    // Topo do card de trás (escala 0.55k, rotação 0) e base do da frente (1.05k) dentro da faixa
    const ry = Math.max(0, Math.min((band - (0.275 + 0.525) * h) / 2, ryCap));
    const slack = Math.max(0, band - (2 * ry + 0.8 * h));
    const cy = zoneTop + 0.275 * h + ry + slack / 2;
    // Cards das laterais (escala 0.8k, rotação máxima) dentro da largura
    const side = halfExtents(w * 0.8, h * 0.8, MAX_ROT);
    const rx = Math.max(0, Math.min(rxBase, W / 2 - MARGIN - side.hw));
    last = { W, H, cy, rx, ry, k, zoneTop, bottom };
    if (maxOverlap(last, n, cardW, cardH) <= MAX_OVERLAP) return last;
  }
  return last!;
}
