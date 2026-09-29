/**
 * Superfície "planeta-circuito" do globo: textura equiretangular de placa de circuito gerada no mount (seed fixa).
 * A geração produz primitivas (trilhas, pads, vias, CIs) e o desenho é separado, para a mesma geração servir ao
 * canvas (map + emissiveMap) e a um preview em SVG.
 *
 * Trilhas andam numa grade em 0/45/90°, não se cruzam (mapa de ocupação), e ficam mais raras perto dos polos, onde
 * a projeção equiretangular esticaria o desenho. O eixo x dá a volta (u = 0 e u = 1 se encontram sem emenda).
 */

export const TEX_W = 2048;
export const TEX_H = 1024;
const CELL = 16;
const GW = TEX_W / CELL; // 128
const GH = TEX_H / CELL; // 64

export type Trace = { kind: "trace"; pts: [number, number][]; width: number };
export type Pad = { kind: "pad"; x: number; y: number; r: number };
export type Via = { kind: "via"; x: number; y: number; r: number };
export type Ic = { kind: "ic"; x: number; y: number; w: number; h: number };
export type Prim = Trace | Pad | Via | Ic;

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

// 8 direções, índice par = cardinal
const DIRS: [number, number][] = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

const center = (cx: number, cy: number): [number, number] => [cx * CELL + CELL / 2, cy * CELL + CELL / 2];

export function generateCircuit(seed = 20260929): Prim[] {
  const rand = mulberry32(seed);
  const occupied = new Uint8Array(GW * GH);
  const prims: Prim[] = [];
  const wrap = (x: number) => ((x % GW) + GW) % GW;
  const idx = (cx: number, cy: number) => cy * GW + wrap(cx);
  const latOk = (cy: number) => cy >= 5 && cy < GH - 5;
  // Densidade cai com a latitude (cos), para os polos não virarem um emaranhado
  const latWeight = (cy: number) => Math.cos(((cy + 0.5) / GH - 0.5) * Math.PI) ** 1.6;

  /** Caminhante: segue uma sequência de direções até bater em algo; devolve as células percorridas. */
  function walk(sx: number, sy: number, dir: number, turns: number[], maxLen: number) {
    const cells: [number, number][] = [[sx, sy]];
    occupied[idx(sx, sy)] = 1;
    let [x, y, d] = [sx, sy, dir];
    for (let i = 0; i < maxLen; i++) {
      d = (d + turns[i] + 8) % 8;
      const [dx, dy] = DIRS[d];
      const nx = x + dx;
      const ny = y + dy;
      if (!latOk(ny) || occupied[idx(nx, ny)]) break;
      // Diagonal não pode "atravessar" duas células ocupadas em cruz
      if (dx && dy && occupied[idx(x + dx, y)] && occupied[idx(x, y + dy)]) break;
      occupied[idx(nx, ny)] = 1;
      cells.push([nx, ny]);
      [x, y] = [nx, ny];
    }
    return cells;
  }

  /** Sequência de curvas: trechos retos longos com curvas de 45° ocasionais que voltam ao eixo. */
  function turnPlan(len: number) {
    const turns: number[] = [];
    let pending = 0;
    for (let i = 0; i < len; i++) {
      if (pending) {
        turns.push(pending);
        pending = 0;
      } else if (rand() < 0.14) {
        const t = rand() < 0.5 ? 1 : -1;
        turns.push(t);
        // Metade das vezes completa 90°, na outra metade volta à direção original depois de uns passos
        if (rand() < 0.5) pending = t;
        else pending = rand() < 0.5 ? -t : 0;
      } else turns.push(0);
    }
    return turns;
  }

  function emitTrace(cells: [number, number][], width: number, endStyle: "pad" | "via" | "none") {
    if (cells.length < 3) return;
    // x "desembrulhado" (contínuo) para o desenho atravessar a borda sem saltos
    const pts: [number, number][] = [];
    let prevX = cells[0][0];
    let offset = 0;
    for (const [cx, cy] of cells) {
      if (cx - prevX > GW / 2) offset -= GW;
      if (prevX - cx > GW / 2) offset += GW;
      prevX = cx;
      pts.push(center(cx + offset, cy));
    }
    prims.push({ kind: "trace", pts, width });
    const [ex, ey] = pts[pts.length - 1];
    const [sx, sy] = pts[0];
    if (endStyle === "pad") prims.push({ kind: "pad", x: ex, y: ey, r: width * 1.9 });
    if (endStyle === "via") prims.push({ kind: "via", x: ex, y: ey, r: width * 2.1 });
    if (rand() < 0.35) prims.push({ kind: "via", x: sx, y: sy, r: width * 1.8 });
  }

  // 1. CIs: retângulos com trilhas saindo das bordas
  for (let n = 0; n < 40; n++) {
    const w = 3 + Math.floor(rand() * 4);
    const h = 3 + Math.floor(rand() * 4);
    const cx = Math.floor(rand() * GW);
    const cy = 8 + Math.floor(rand() * (GH - 16 - h));
    if (rand() > latWeight(cy)) continue;
    let free = true;
    for (let y = cy - 1; y <= cy + h; y++) for (let x = cx - 1; x <= cx + w; x++) if (occupied[idx(x, y)]) free = false;
    if (!free) continue;
    for (let y = cy; y < cy + h; y++) for (let x = cx; x < cx + w; x++) occupied[idx(x, y)] = 1;
    const [x0, y0] = [cx * CELL, cy * CELL];
    prims.push({ kind: "ic", x: x0, y: y0, w: w * CELL, h: h * CELL });
    // Trilhas saindo de cada lado
    const sides: { start: (i: number) => [number, number]; count: number; dir: number }[] = [
      { start: (i) => [cx + i, cy - 1], count: w, dir: 6 },
      { start: (i) => [cx + i, cy + h], count: w, dir: 2 },
      { start: (i) => [cx - 1, cy + i], count: h, dir: 4 },
      { start: (i) => [cx + w, cy + i], count: h, dir: 0 },
    ];
    for (const side of sides) {
      for (let i = 0; i < side.count; i++) {
        if (rand() < 0.35) continue;
        const [sx, sy] = side.start(i);
        if (!latOk(sy) || occupied[idx(sx, sy)]) continue;
        const len = 4 + Math.floor(rand() * 18);
        emitTrace(walk(sx, sy, side.dir, turnPlan(len), len), 2, rand() < 0.6 ? "pad" : "via");
      }
    }
  }

  // 2. Barramentos: trilhas paralelas com as mesmas curvas
  for (let n = 0; n < 70; n++) {
    const sy = 5 + Math.floor(rand() * (GH - 10));
    if (rand() > latWeight(sy)) continue;
    const sx = Math.floor(rand() * GW);
    const dir = Math.floor(rand() * 4) * 2;
    const perp = DIRS[(dir + 2) % 8];
    const lanes = 2 + Math.floor(rand() * 5);
    const len = 8 + Math.floor(rand() * 30);
    const turns = turnPlan(len);
    for (let k = 0; k < lanes; k++) {
      const x = sx + perp[0] * k;
      const y = sy + perp[1] * k;
      if (!latOk(y) || occupied[idx(x, y)]) continue;
      emitTrace(walk(x, y, dir, turns, len), 1.8, rand() < 0.5 ? "pad" : "via");
    }
  }

  // 3. Trilhas soltas preenchendo o resto
  for (let n = 0; n < 1500; n++) {
    const sy = 5 + Math.floor(rand() * (GH - 10));
    if (rand() > latWeight(sy)) continue;
    const sx = Math.floor(rand() * GW);
    if (occupied[idx(sx, sy)]) continue;
    const dir = rand() < 0.75 ? Math.floor(rand() * 4) * 2 : Math.floor(rand() * 4) * 2 + 1;
    const len = 3 + Math.floor(rand() * 16);
    emitTrace(walk(sx, sy, dir, turnPlan(len), len), rand() < 0.2 ? 2.4 : 1.5, rand() < 0.5 ? "pad" : "via");
  }

  return prims;
}

type Ctx = CanvasRenderingContext2D;

/** Desenha cada primitiva também deslocada de ±largura, para a textura fechar sem emenda em u = 0/1. */
function eachWrap(draw: (dx: number) => void) {
  draw(0);
  draw(-TEX_W);
  draw(TEX_W);
}

function drawPrims(ctx: Ctx, prims: Prim[], color: string, strength: { trace: number; pad: number; ic: number }) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of prims) {
    eachWrap((dx) => {
      if (p.kind === "trace") {
        ctx.globalAlpha = strength.trace;
        ctx.strokeStyle = color;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(p.pts[0][0] + dx, p.pts[0][1]);
        for (let i = 1; i < p.pts.length; i++) ctx.lineTo(p.pts[i][0] + dx, p.pts[i][1]);
        ctx.stroke();
      } else if (p.kind === "pad") {
        ctx.globalAlpha = strength.pad;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "via") {
        ctx.globalAlpha = strength.pad;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.globalAlpha = strength.ic;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(p.x + dx + 3, p.y + 3, p.w - 6, p.h - 6);
        ctx.globalAlpha = strength.ic * 0.35;
        ctx.fillStyle = color;
        ctx.fillRect(p.x + dx + 3, p.y + 3, p.w - 6, p.h - 6);
      }
    });
  }
  ctx.globalAlpha = 1;
}

/**
 * base: roxo profundo com manchas mais claras (#1A1560 -> #5749A5) e as trilhas em #A89CF0 discretas.
 * emissive: só as trilhas/pads em branco sobre preto (vira emissiveMap e máscara do rastro).
 */
export function drawCircuit(base: Ctx, emissive: Ctx, prims: Prim[], seed = 7, scale = 1) {
  const rand = mulberry32(seed);
  // Desenha nas coordenadas de TEX_W x TEX_H; o canvas pode ser menor (scale < 1 em dispositivos fracos)
  base.setTransform(scale, 0, 0, scale, 0, 0);
  emissive.setTransform(scale, 0, 0, scale, 0, 0);

  base.fillStyle = "#1A1560";
  base.fillRect(0, 0, TEX_W, TEX_H);
  // Manchas largas e suaves (variação de cor do "solo" da placa)
  for (let i = 0; i < 38; i++) {
    const x = rand() * TEX_W;
    const y = TEX_H * (0.15 + rand() * 0.7);
    const r = 120 + rand() * 320;
    eachWrap((dx) => {
      const g = base.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      g.addColorStop(0, `rgba(87, 73, 165, ${0.22 + rand() * 0.18})`);
      g.addColorStop(1, "rgba(87, 73, 165, 0)");
      base.fillStyle = g;
      base.fillRect(x + dx - r, y - r, r * 2, r * 2);
    });
  }
  // Polos um pouco mais escuros (onde quase não há trilhas)
  const pole = base.createLinearGradient(0, 0, 0, TEX_H);
  pole.addColorStop(0, "rgba(10, 8, 48, 0.6)");
  pole.addColorStop(0.18, "rgba(10, 8, 48, 0)");
  pole.addColorStop(0.82, "rgba(10, 8, 48, 0)");
  pole.addColorStop(1, "rgba(10, 8, 48, 0.6)");
  base.fillStyle = pole;
  base.fillRect(0, 0, TEX_W, TEX_H);

  drawPrims(base, prims, "#A89CF0", { trace: 0.5, pad: 0.75, ic: 0.55 });

  emissive.fillStyle = "#000";
  emissive.fillRect(0, 0, TEX_W, TEX_H);
  drawPrims(emissive, prims, "#fff", { trace: 1, pad: 1, ic: 0.7 });
}
