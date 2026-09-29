/**
 * Qualidade de render estimada pelo dispositivo (portado do renderQuality da referência):
 * "low" em mobile/touch com tela pequena, poucos núcleos ou pouca memória, ou economia de dados.
 */
export type RenderQuality = "high" | "low";

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

let cached: RenderQuality | null = null;

export function getRenderQuality(): RenderQuality {
  if (cached) return cached;
  if (typeof navigator === "undefined") return "low";
  const nav = navigator as NavigatorHints;
  const mobile = matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 900;
  const limited = (nav.hardwareConcurrency || 4) <= 4 || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4);
  const slow = !!nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  cached = mobile || limited || slow ? "low" : "high";
  return cached;
}

/** dpr máximo: 2 em desktop forte, 1.25 em mobile/fraco (nunca acima do devicePixelRatio). */
export function maxDpr() {
  const device = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
  return Math.min(device, getRenderQuality() === "low" ? 1.25 : 2);
}
