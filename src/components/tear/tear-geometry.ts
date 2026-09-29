/**
 * Geometria do rasgo da seção "FORÇA". Tudo é determinístico (seeds fixas): o mesmo caminho vira a linha que se
 * desenha, o clip da metade de cima e (com um pequeno offset de ruído) o clip da metade de baixo.
 *
 * Coordenadas:
 * - "unidades da palavra": viewBox fixo do SVG da palavra (WORD). A forma geral do rasgo é definida aqui, então
 *   escala junto com a palavra em qualquer tela.
 * - "view": px da camada fixa (viewport da seção). A microirregularidade é em px, para ter o mesmo grão em
 *   qualquer tela.
 * - "elemento": px de cada metade, que é maior que a viewport (margens mx/my) para rotacionar sem expor cantos.
 */

export const WORD = {
  vbW: 1600,
  vbH: 440,
  fontSize: 400,
  baseline: 340,
  // Meio da altura das maiúsculas (cap height ~0.7em => topo em 60, base em 340)
  tearY: 200,
  // A palavra ocupa 90% da largura, centralizada (o CSS usa as mesmas proporções)
  widthRatio: 0.9,
} as const;

export type Pt = { x: number; y: number };

export type TearLayout = {
  W: number;
  H: number;
  mx: number;
  my: number;
  /** px por unidade da palavra */
  s: number;
  /** canto superior esquerdo do viewBox da palavra, em px da view */
  x0: number;
  y0: number;
};

export function computeLayout(W: number, H: number, mx: number, my: number): TearLayout {
  const wordW = W * WORD.widthRatio;
  const s = wordW / WORD.vbW;
  return { W, H, mx, my, s, x0: (W - wordW) / 2, y0: H / 2 - (WORD.vbH * s) / 2 };
}

// --- ruído determinístico ------------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise 1D suavizado (smoothstep), período de 2048 amostras. */
function valueNoise(seed: number) {
  const rand = mulberry32(seed);
  const size = 2048;
  const table = Float32Array.from({ length: size }, () => rand() * 2 - 1);
  return (t: number) => {
    const i = Math.floor(t);
    const f = t - i;
    const a = table[((i % size) + size) % size];
    const b = table[(((i + 1) % size) + size) % size];
    const u = f * f * (3 - 2 * f);
    return a + (b - a) * u;
  };
}

const nDrift = valueNoise(7);
const nMicroA = valueNoise(19);
const nMicroB = valueNoise(23);
const nGap = valueNoise(31);
const nMicroEdgeB = valueNoise(37);

/**
 * Forma geral (unidades da palavra, deslocamento vertical a partir de WORD.tearY): um "sinal digital" com
 * patamares largos de transição suave (tanh de senoide), uma onda secundária e um desvio lento.
 */
function macro(u: number) {
  const digital = 34 * Math.tanh(2.6 * Math.sin((2 * Math.PI * u) / 560 + 0.9));
  const wave = 14 * Math.sin((2 * Math.PI * u) / 240 + 2.1);
  const drift = 10 * nDrift(u / 90);
  return digital + wave + drift;
}

/**
 * Bordas do rasgo em px da view, cobrindo a largura da metade (view + margens).
 * a = borda da metade de cima; b = borda da metade de baixo, sempre um pouco acima de a. Em repouso as metades
 * se sobrepõem na faixa entre b e a (a folha parece inteira); ao separar, essa diferença vira uma fresta de
 * largura irregular, e as duas bordas não são simétricas, como papel de verdade.
 */
export function tearEdges(L: TearLayout) {
  const step = L.W < 768 ? 2 : 2.5;
  const from = -L.mx - 16;
  const to = L.W + L.mx + 16;
  const a: Pt[] = [];
  const b: Pt[] = [];

  for (let x = from; x <= to + step; x += step) {
    const u = (x - L.x0) / L.s;
    const base = L.y0 + L.s * (WORD.tearY + macro(u));
    // Microirregularidade em px: fibras (curta) + serrilhado orgânico (mais curto ainda, menor)
    const micro = 1.25 * nMicroA(x / 3.4) + 0.5 * nMicroB(x / 1.35);
    const ya = base + micro;
    const gap = 1.1 + 2.7 * (0.5 + 0.5 * nGap(x / 36));
    const yb = ya - gap + 0.45 * nMicroEdgeB(x / 2.2);
    a.push({ x, y: ya });
    b.push({ x, y: yb });
  }
  return { a, b };
}

// --- paths ---------------------------------------------------------------------------------------------

const f = (n: number) => Math.round(n * 10) / 10;

/** Polilinha aberta, deslocada (dx, dy). */
export function lineD(pts: Pt[], dx = 0, dy = 0) {
  let d = `M${f(pts[0].x + dx)} ${f(pts[0].y + dy)}`;
  for (let i = 1; i < pts.length; i++) d += `L${f(pts[i].x + dx)} ${f(pts[i].y + dy)}`;
  return d;
}

/** Região acima da borda (metade de cima), em px do elemento. */
export function topRegionD(pts: Pt[], mx: number, my: number) {
  const first = pts[0];
  const last = pts[pts.length - 1];
  let d = `M${f(first.x + mx)} -2L${f(last.x + mx)} -2`;
  for (let i = pts.length - 1; i >= 0; i--) d += `L${f(pts[i].x + mx)} ${f(pts[i].y + my)}`;
  return `${d}Z`;
}

/** Região abaixo da borda (metade de baixo), em px do elemento. */
export function bottomRegionD(pts: Pt[], mx: number, my: number, elH: number) {
  const first = pts[0];
  const last = pts[pts.length - 1];
  let d = `M${f(first.x + mx)} ${f(elH + 2)}`;
  for (const p of pts) d += `L${f(p.x + mx)} ${f(p.y + my)}`;
  return `${d}L${f(last.x + mx)} ${f(elH + 2)}Z`;
}

export function yRange(pts: Pt[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const p of pts) {
    if (p.y < min) min = p.y;
    if (p.y > max) max = p.y;
  }
  return { min, max };
}
